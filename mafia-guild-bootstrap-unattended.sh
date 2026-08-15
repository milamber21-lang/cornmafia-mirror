#!/usr/bin/env bash
set -Eeuo pipefail

# ============================================================================
# Mafia guild node bootstrap
# Target: Debian / Linux Mint / Ubuntu-family systems using systemd
#
# Fully unattended once TS_AUTH_KEY below is filled in.
#
# What it does:
#   - installs/enables OpenSSH
#   - installs/enables Tailscale
#   - creates Linux user: mafiaadmin
#   - installs the fleet SSH public key
#   - gives mafiaadmin passwordless sudo
#   - disables password SSH login for mafiaadmin only
#   - joins the Guild tailnet as tag:guild-node
#   - uses the machine's current hostname as the Tailscale hostname
#   - if UFW is active, allows SSH on tailscale0
#
# What it does NOT do:
#   - does not enable Tailscale SSH
#   - does not disable SSH for existing users
#   - does not alter Docker
#   - does not change the machine hostname
# ============================================================================

readonly ADMIN_USER="mafiaadmin"
readonly TAILSCALE_TAG="tag:guild-node"

# ---------------------------------------------------------------------------
# EDIT THIS BEFORE DEPLOYMENT
# Paste your reusable Tailscale auth key between the quotes.
# Example format: tskey-auth-xxxxxxxxxxxxxxxx
# ---------------------------------------------------------------------------
readonly TS_AUTH_KEY="PASTE_YOUR_TAILSCALE_AUTH_KEY_HERE"

# Fleet public SSH key.
readonly SSH_PUBLIC_KEY='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICuJxobHY91C8bJXvF+QeW07yMAUgtcPnU15y8sAfrMc mafia-fleet-admin'

log() {
    printf '\n==> %s\n' "$*"
}

die() {
    printf 'ERROR: %s\n' "$*" >&2
    exit 1
}

[[ "$EUID" -eq 0 ]] || die "Run this script with sudo/root."
command -v apt-get >/dev/null 2>&1 || die "This script requires an apt-based Debian/Mint/Ubuntu system."
command -v systemctl >/dev/null 2>&1 || die "systemd/systemctl is required."

if [[ "$TS_AUTH_KEY" == "PASTE_YOUR_TAILSCALE_AUTH_KEY_HERE" || -z "$TS_AUTH_KEY" ]]; then
    die "Edit TS_AUTH_KEY near the top of this script before deploying it."
fi

NODE_NAME="$(hostname -s | tr '[:upper:]' '[:lower:]')"

if [[ ! "$NODE_NAME" =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$ ]]; then
    die "Current hostname '$NODE_NAME' is not suitable for Tailscale. Use letters, numbers, and hyphens only."
fi

log "Provisioning $NODE_NAME"

# ---------------------------------------------------------------------------
# Packages
# ---------------------------------------------------------------------------

export DEBIAN_FRONTEND=noninteractive

log "Installing prerequisites"
apt-get update
apt-get install -y ca-certificates curl openssh-server sudo

log "Installing Tailscale"
if ! command -v tailscale >/dev/null 2>&1; then
    curl -fsSL https://tailscale.com/install.sh | sh
else
    printf 'Tailscale is already installed.\n'
fi

systemctl enable --now tailscaled

# Refuse to silently move a machine that is already connected to a tailnet.
EXISTING_TS_IP="$(tailscale ip -4 2>/dev/null | head -n 1 || true)"
if [[ -n "$EXISTING_TS_IP" ]]; then
    printf '\nExisting Tailscale connection detected:\n'
    tailscale status || true
    die "This host is already connected to Tailscale at $EXISTING_TS_IP. Refusing to change its tailnet automatically."
fi

# ---------------------------------------------------------------------------
# OpenSSH
# ---------------------------------------------------------------------------

log "Enabling OpenSSH"
if systemctl list-unit-files ssh.service >/dev/null 2>&1; then
    systemctl enable --now ssh
elif systemctl list-unit-files sshd.service >/dev/null 2>&1; then
    systemctl enable --now sshd
else
    die "Could not locate ssh.service or sshd.service."
fi

# ---------------------------------------------------------------------------
# Linux administrator account
# ---------------------------------------------------------------------------

log "Creating Linux administrator account: $ADMIN_USER"

if ! id "$ADMIN_USER" >/dev/null 2>&1; then
    useradd --create-home --shell /bin/bash "$ADMIN_USER"

    # Keep the account usable by PAM/account checks without creating a
    # password anyone knows. SSH password authentication is disabled below.
    RANDOM_PASSWORD="$(head -c 48 /dev/urandom | base64 | tr -d '\n')"
    printf '%s:%s\n' "$ADMIN_USER" "$RANDOM_PASSWORD" | chpasswd
    unset RANDOM_PASSWORD
else
    printf 'User %s already exists; preserving the account.\n' "$ADMIN_USER"
fi

usermod -aG sudo "$ADMIN_USER"

ADMIN_HOME="$(getent passwd "$ADMIN_USER" | cut -d: -f6)"
ADMIN_GROUP="$(id -gn "$ADMIN_USER")"

[[ -n "$ADMIN_HOME" ]] || die "Could not determine home directory for $ADMIN_USER."

# ---------------------------------------------------------------------------
# SSH key
# ---------------------------------------------------------------------------

log "Installing fleet SSH public key"

install -d -m 0700 -o "$ADMIN_USER" -g "$ADMIN_GROUP" "$ADMIN_HOME/.ssh"
touch "$ADMIN_HOME/.ssh/authorized_keys"
chown "$ADMIN_USER:$ADMIN_GROUP" "$ADMIN_HOME/.ssh/authorized_keys"
chmod 0600 "$ADMIN_HOME/.ssh/authorized_keys"

if ! grep -qxF "$SSH_PUBLIC_KEY" "$ADMIN_HOME/.ssh/authorized_keys"; then
    printf '%s\n' "$SSH_PUBLIC_KEY" >> "$ADMIN_HOME/.ssh/authorized_keys"
fi

chown "$ADMIN_USER:$ADMIN_GROUP" "$ADMIN_HOME/.ssh/authorized_keys"
chmod 0600 "$ADMIN_HOME/.ssh/authorized_keys"

# Validate embedded public key.
KEY_CHECK_FILE="$(mktemp)"
printf '%s\n' "$SSH_PUBLIC_KEY" > "$KEY_CHECK_FILE"
ssh-keygen -l -f "$KEY_CHECK_FILE" >/dev/null 2>&1 || {
    rm -f "$KEY_CHECK_FILE"
    die "Embedded SSH public key failed validation."
}
rm -f "$KEY_CHECK_FILE"

# ---------------------------------------------------------------------------
# Passwordless sudo
# ---------------------------------------------------------------------------

log "Configuring passwordless sudo"

SUDOERS_FILE="/etc/sudoers.d/90-$ADMIN_USER"
printf '%s ALL=(ALL:ALL) NOPASSWD: ALL\n' "$ADMIN_USER" > "$SUDOERS_FILE"
chmod 0440 "$SUDOERS_FILE"
visudo -cf "$SUDOERS_FILE" >/dev/null || die "Generated sudoers file failed validation."

# ---------------------------------------------------------------------------
# SSH policy for mafiaadmin only
# ---------------------------------------------------------------------------

log "Restricting $ADMIN_USER to SSH public-key authentication"

SSHD_DROPIN_DIR="/etc/ssh/sshd_config.d"
SSHD_DROPIN="$SSHD_DROPIN_DIR/90-mafiaadmin.conf"

mkdir -p "$SSHD_DROPIN_DIR"

cat > "$SSHD_DROPIN" <<EOF
# Managed by mafia-guild-bootstrap-unattended.sh
# Existing users retain their current SSH authentication settings.
Match User $ADMIN_USER
    PasswordAuthentication no
    KbdInteractiveAuthentication no
    PubkeyAuthentication yes
Match all
EOF

if ! sshd -t; then
    rm -f "$SSHD_DROPIN"
    die "OpenSSH rejected the mafiaadmin configuration; it was removed."
fi

if systemctl is-active --quiet ssh; then
    systemctl reload ssh
elif systemctl is-active --quiet sshd; then
    systemctl reload sshd
fi

# ---------------------------------------------------------------------------
# Tailscale enrollment
# ---------------------------------------------------------------------------

log "Joining Guild tailnet as $TAILSCALE_TAG"

# Supplying --advertise-tags explicitly causes enrollment to fail if the
# auth key is not authorized for tag:guild-node, rather than silently creating
# an untagged device.
tailscale up     --auth-key="$TS_AUTH_KEY"     --hostname="$NODE_NAME"     --advertise-tags="$TAILSCALE_TAG"

TS_IP="$(tailscale ip -4 | head -n 1)"
[[ -n "$TS_IP" ]] || die "Tailscale connected but no IPv4 address was returned."

# ---------------------------------------------------------------------------
# UFW compatibility
# ---------------------------------------------------------------------------

log "Checking firewall"

if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q '^Status: active'; then
    if ! ufw status | grep -Fq 'tailscale0'; then
        ufw allow in on tailscale0 to any port 22 proto tcp comment 'Mafia admin SSH via Tailscale'
    else
        printf 'UFW already contains a tailscale0 rule; leaving existing rules intact.\n'
    fi
else
    printf 'UFW is not active; no firewall rules were changed.\n'
fi

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log "Bootstrap complete"

printf 'Node hostname   : %s\n' "$NODE_NAME"
printf 'Tailscale IP   : %s\n' "$TS_IP"
printf 'Linux user     : %s\n' "$ADMIN_USER"
printf 'Tailscale tag  : %s\n' "$TAILSCALE_TAG"
printf '\nAdmin SSH command:\n'
printf '  ssh -i ~/.ssh/mafia_admin %s@%s\n' "$ADMIN_USER" "$TS_IP"
printf '\nWith MagicDNS:\n'
printf '  ssh -i ~/.ssh/mafia_admin %s@%s\n' "$ADMIN_USER" "$NODE_NAME"
