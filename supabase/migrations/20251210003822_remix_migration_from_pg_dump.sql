CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    whatsapp text NOT NULL,
    has_patins boolean DEFAULT false NOT NULL,
    service_types text[] DEFAULT '{}'::text[] NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    address text,
    region text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    base_price numeric(10,2) DEFAULT 50.00,
    price_per_km numeric(10,2) DEFAULT 5.00,
    patins_extra_price numeric(10,2) DEFAULT 30.00
);


--
-- Name: providers providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_pkey PRIMARY KEY (id);


--
-- Name: providers update_providers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON public.providers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: providers Anyone can register as provider; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can register as provider" ON public.providers FOR INSERT WITH CHECK (true);


--
-- Name: providers Anyone can view providers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view providers" ON public.providers FOR SELECT USING (true);


--
-- Name: providers Providers can update their own records by whatsapp; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can update their own records by whatsapp" ON public.providers FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: providers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


