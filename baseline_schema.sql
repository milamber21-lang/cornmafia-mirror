--
-- PostgreSQL database dump
--

\restrict RjdbsGpy1myKtxSu3Mah4cL1iWhMmb7oQsnlNJHWj81eRTuzF55NcNWo81oEVJT

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: cm
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO cm;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: cm
--

COMMENT ON SCHEMA public IS '';


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: cm
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict RjdbsGpy1myKtxSu3Mah4cL1iWhMmb7oQsnlNJHWj81eRTuzF55NcNWo81oEVJT

