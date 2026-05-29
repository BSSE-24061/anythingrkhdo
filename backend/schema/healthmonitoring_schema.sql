--
-- PostgreSQL database dump
--

\restrict 0Dm7iiVZGeuUCjJhbdVVRdtdAfnvq8PiHTxsfct9DRrDp36rGRONFQijhMr0Z1J

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

-- Started on 2026-05-29 13:50:55

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
-- TOC entry 2 (class 3079 OID 16938)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5347 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 897 (class 1247 OID 16978)
-- Name: alert_severity; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.alert_severity AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


ALTER TYPE public.alert_severity OWNER TO postgres;

--
-- TOC entry 894 (class 1247 OID 16968)
-- Name: appointment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.appointment_status AS ENUM (
    'pending',
    'confirmed',
    'completed',
    'cancelled'
);


ALTER TYPE public.appointment_status OWNER TO postgres;

--
-- TOC entry 903 (class 1247 OID 16996)
-- Name: forum_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.forum_status AS ENUM (
    'active',
    'hidden',
    'deleted'
);


ALTER TYPE public.forum_status OWNER TO postgres;

--
-- TOC entry 891 (class 1247 OID 16960)
-- Name: gender_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.gender_type AS ENUM (
    'male',
    'female',
    'other'
);


ALTER TYPE public.gender_type OWNER TO postgres;

--
-- TOC entry 900 (class 1247 OID 16988)
-- Name: medication_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.medication_status AS ENUM (
    'pending',
    'taken',
    'missed'
);


ALTER TYPE public.medication_status OWNER TO postgres;

--
-- TOC entry 909 (class 1247 OID 17014)
-- Name: notification_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notification_type AS ENUM (
    'info',
    'warning',
    'alert',
    'system'
);


ALTER TYPE public.notification_type OWNER TO postgres;

--
-- TOC entry 906 (class 1247 OID 17004)
-- Name: report_reason; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.report_reason AS ENUM (
    'spam',
    'abuse',
    'misinformation',
    'other'
);


ALTER TYPE public.report_reason OWNER TO postgres;

--
-- TOC entry 888 (class 1247 OID 16950)
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'patient',
    'doctor',
    'admin',
    'consultant'
);


ALTER TYPE public.user_role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 229 (class 1259 OID 17168)
-- Name: alerts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alerts (
    alert_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patient_user_id uuid,
    vital_id uuid,
    alert_type character varying(100),
    message text,
    severity public.alert_severity DEFAULT 'low'::public.alert_severity,
    is_read boolean DEFAULT false,
    triggered_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.alerts OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 17044)
-- Name: appointments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointments (
    appointment_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patient_user_id uuid NOT NULL,
    doctor_user_id uuid NOT NULL,
    scheduled_at timestamp without time zone NOT NULL,
    duration_minutes integer,
    reason text,
    status public.appointment_status DEFAULT 'pending'::public.appointment_status,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT appointments_duration_minutes_check CHECK ((duration_minutes > 0))
);


ALTER TABLE public.appointments OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 17383)
-- Name: article_bookmarks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.article_bookmarks (
    bookmark_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    article_id uuid,
    user_id uuid,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.article_bookmarks OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 17344)
-- Name: article_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.article_comments (
    comment_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    article_id uuid,
    user_id uuid,
    body text,
    status public.forum_status DEFAULT 'active'::public.forum_status,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.article_comments OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 17365)
-- Name: article_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.article_likes (
    like_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    article_id uuid,
    user_id uuid,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.article_likes OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 17327)
-- Name: blog_articles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blog_articles (
    article_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    author_user_id uuid,
    title character varying(255),
    body text,
    cover_image text,
    category character varying(100),
    status public.forum_status DEFAULT 'active'::public.forum_status,
    likes_count integer DEFAULT 0,
    published_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.blog_articles OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 17244)
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_messages (
    message_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    room_id uuid,
    sender_id uuid,
    message_text text,
    is_read boolean DEFAULT false,
    sent_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.chat_messages OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 17221)
-- Name: chat_rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_rooms (
    room_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patient_user_id uuid,
    doctor_user_id uuid,
    consultant_user_id uuid,
    room_type character varying(50),
    created_at timestamp without time zone DEFAULT now(),
    last_message_at timestamp without time zone
);


ALTER TABLE public.chat_rooms OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 17508)
-- Name: doctor_availability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctor_availability (
    availability_id uuid DEFAULT gen_random_uuid() NOT NULL,
    doctor_user_id uuid NOT NULL,
    day_of_week character varying(10) NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT doctor_availability_day_of_week_check CHECK (((day_of_week)::text = ANY ((ARRAY['Monday'::character varying, 'Tuesday'::character varying, 'Wednesday'::character varying, 'Thursday'::character varying, 'Friday'::character varying, 'Saturday'::character varying, 'Sunday'::character varying])::text[])))
);


ALTER TABLE public.doctor_availability OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 17575)
-- Name: forum_post_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.forum_post_likes (
    like_id integer NOT NULL,
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.forum_post_likes OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 17574)
-- Name: forum_post_likes_like_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.forum_post_likes_like_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.forum_post_likes_like_id_seq OWNER TO postgres;

--
-- TOC entry 5348 (class 0 OID 0)
-- Dependencies: 242
-- Name: forum_post_likes_like_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.forum_post_likes_like_id_seq OWNED BY public.forum_post_likes.like_id;


--
-- TOC entry 233 (class 1259 OID 17266)
-- Name: forum_posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.forum_posts (
    post_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    category character varying(100),
    title character varying(255),
    body text,
    status public.forum_status DEFAULT 'active'::public.forum_status,
    views_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    likes_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.forum_posts OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 17284)
-- Name: forum_replies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.forum_replies (
    reply_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    post_id uuid,
    user_id uuid,
    body text,
    is_accepted boolean DEFAULT false,
    status public.forum_status DEFAULT 'active'::public.forum_status,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.forum_replies OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 17306)
-- Name: forum_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.forum_reports (
    report_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    post_id uuid,
    reported_by uuid,
    reason public.report_reason,
    description text,
    status character varying(30) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    resolution character varying(50),
    resolved_at timestamp with time zone
);


ALTER TABLE public.forum_reports OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 17191)
-- Name: medical_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medical_history (
    history_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patient_user_id uuid,
    event_type character varying(50),
    title character varying(255),
    description text,
    related_prescription_id uuid,
    related_appointment_id uuid,
    event_date date,
    added_by uuid,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.medical_history OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 17598)
-- Name: medical_specializations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medical_specializations (
    specialization_id integer NOT NULL,
    name character varying(120) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.medical_specializations OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 17597)
-- Name: medical_specializations_specialization_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.medical_specializations_specialization_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.medical_specializations_specialization_id_seq OWNER TO postgres;

--
-- TOC entry 5349 (class 0 OID 0)
-- Dependencies: 244
-- Name: medical_specializations_specialization_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.medical_specializations_specialization_id_seq OWNED BY public.medical_specializations.specialization_id;


--
-- TOC entry 227 (class 1259 OID 17133)
-- Name: medication_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medication_logs (
    log_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patient_medication_id uuid,
    patient_user_id uuid,
    scheduled_time timestamp without time zone,
    taken_at timestamp without time zone,
    status public.medication_status DEFAULT 'pending'::public.medication_status,
    dose_period character varying(20),
    dose_dosage text,
    missed_alert_sent boolean DEFAULT false NOT NULL
);


ALTER TABLE public.medication_logs OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 17099)
-- Name: medications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medications (
    medication_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(100),
    description text,
    status character varying(50) DEFAULT 'approved'::character varying
);


ALTER TABLE public.medications OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 17401)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    notification_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    type public.notification_type,
    title character varying(255),
    body text,
    reference_id uuid,
    reference_type character varying(100),
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 17110)
-- Name: patient_medications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patient_medications (
    patient_medication_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    prescription_id uuid,
    patient_user_id uuid,
    medication_id uuid,
    dosage character varying(100),
    frequency character varying(100),
    start_date date,
    end_date date,
    dosage_schedule jsonb
);


ALTER TABLE public.patient_medications OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 17072)
-- Name: prescriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prescriptions (
    prescription_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patient_user_id uuid,
    doctor_user_id uuid,
    appointment_id uuid,
    diagnosis character varying(255),
    diagnosis_notes text,
    symptoms_notes text,
    prescribed_at timestamp without time zone DEFAULT now(),
    follow_up_date date
);


ALTER TABLE public.prescriptions OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 17023)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    full_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    role public.user_role NOT NULL,
    profile_picture text,
    phone character varying(20),
    is_active boolean DEFAULT true,
    date_of_birth date,
    gender public.gender_type,
    blood_group character varying(10),
    address text,
    emergency_contact character varying(50),
    specialization character varying(255),
    license_number character varying(100),
    hospital_name character varying(255),
    experience_years integer,
    is_verified boolean DEFAULT false,
    access_level character varying(50),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 17152)
-- Name: vitals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vitals (
    vital_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patient_user_id uuid,
    blood_pressure_systolic integer,
    blood_pressure_diastolic integer,
    heart_rate integer,
    glucose_level numeric,
    oxygen_saturation numeric,
    temperature numeric,
    weight numeric,
    logged_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.vitals OWNER TO postgres;

--
-- TOC entry 5037 (class 2604 OID 17578)
-- Name: forum_post_likes like_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_post_likes ALTER COLUMN like_id SET DEFAULT nextval('public.forum_post_likes_like_id_seq'::regclass);


--
-- TOC entry 5039 (class 2604 OID 17601)
-- Name: medical_specializations specialization_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_specializations ALTER COLUMN specialization_id SET DEFAULT nextval('public.medical_specializations_specialization_id_seq'::regclass);


--
-- TOC entry 5325 (class 0 OID 17168)
-- Dependencies: 229
-- Data for Name: alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alerts (alert_id, patient_user_id, vital_id, alert_type, message, severity, is_read, triggered_at) FROM stdin;
0e5add19-e232-40d3-8d37-bb33ce11951c	2a5a1644-9799-4f9f-8d7d-3efe49e07dbc	1f6f5d08-5a5f-4b73-8f60-c1d41432735d	Low Oxygen	Patient oxygen saturation dropped to 88%. Immediate attention required.	critical	f	2026-04-28 15:29:24.028571
2872b66b-1731-4b8f-988b-920570afd0a4	2a5a1644-9799-4f9f-8d7d-3efe49e07dbc	1f6f5d08-5a5f-4b73-8f60-c1d41432735d	High BP	Blood pressure slightly high	medium	f	2026-04-28 16:16:19.867623
22d52654-fcda-4b88-bf31-896cf5494c93	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	11c8c709-9628-4da7-8997-dca289c92491	High BP	Blood pressure slightly high	medium	f	2026-04-28 16:16:19.867623
ee21b558-4220-462a-ade4-f9f5f61d473f	194d097e-b430-4d5f-ae54-ca6ea35dd857	5360e968-2f29-49dc-bf0e-becbc1bf0c7e	High BP	Blood pressure slightly high	medium	f	2026-04-28 16:16:19.867623
44b35ba0-4e1d-48df-9918-b73eaebe8561	09f99c55-20e8-4e86-a7ba-01f655e26a6a	93019213-7913-46a1-9fd4-833acf7662df	High BP	Blood pressure slightly high	medium	f	2026-04-28 16:16:19.867623
a79ffcfa-bb97-429f-9868-ba067c9113a8	87a8d557-d37a-4ade-bc34-978ef2c4a322	5cbb2607-8be0-43bb-aad9-8b4bcab74012	High BP	Blood pressure slightly high	medium	f	2026-04-28 16:16:19.867623
d6ed2eef-5491-408e-a0ff-2886cfba8fc9	0cfb955b-5284-4ed0-bbcc-2f29085cf65e	84060462-2167-4ad7-b2d7-ed8c6edab5ca	High BP	Blood pressure slightly high	medium	f	2026-04-28 16:16:19.867623
e676541a-118b-43c9-9233-241527587417	20a16369-e2ab-403e-a650-e1bd3fd0090a	ed1a4554-3db6-4644-b93b-40d56303ae6c	High BP	Blood pressure slightly high	medium	f	2026-04-28 16:16:19.867623
a6f51f9a-6b03-4e81-b232-2a26672c5188	2a5a1644-9799-4f9f-8d7d-3efe49e07dbc	41ce3721-5fde-4831-876d-2c71319e0641	High BP	Blood pressure slightly high	medium	f	2026-04-28 16:16:19.867623
1782275c-5885-4adf-b612-3ff82838e245	908990f4-84a5-4e87-879c-294bc339b9a9	e913e77c-526b-4ab5-8081-bedfa01d9cf9	High BP	Blood pressure slightly high	medium	f	2026-04-28 16:16:19.867623
149edc6b-4097-482d-a10c-5e657b497e9c	70edd123-38bc-4816-a27d-988d33612e6f	28b3b462-6867-4672-afe7-08247c0a085b	High BP	Blood pressure slightly high	medium	f	2026-04-28 16:16:19.867623
6293eb31-b750-484e-a060-9f9cca0ec344	e5acd622-2706-4a0d-8583-1870a1e82861	7dfdfdec-d55c-44e2-bb39-ab08b067f0a3	Hypertensive Crisis	Systolic Blood Pressure spiked to 500.	high	f	2026-05-10 14:51:16.2533
1ca0d01e-7abd-4626-95bc-d63af8ad36df	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	eb73a84c-e1d3-4cf6-820d-01e017260c0e	Severe Hyperglycemia	Blood glucose logged at 500 mg/dL (very high).	high	t	2026-05-15 00:17:07.298536
7e514ea0-1514-4245-9d47-7067c0ec2421	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	ca3c88aa-b8f2-403c-92fe-9139a079d441	Hypertensive Crisis	Systolic Blood Pressure spiked to 500.	high	t	2026-05-17 18:09:09.123747
d092bdb9-b283-41f9-a0ca-80a000a6814e	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	bab3ef63-14f4-4c1e-9d5e-247911fb90f9	Severe Hyperglycemia	Blood glucose logged at 4999 mg/dL (very high).	high	t	2026-05-17 18:11:12.001769
a68c5913-9bae-46e2-b3c3-4f1528dea235	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 2 of Paracetamol for the morning dose.	medium	t	2026-05-17 18:41:57.888282
74ea4af8-db16-444b-98e9-f36706e8b23b	c2987363-8e64-4dc2-84fd-1260b0b3bad6	46571062-416e-4429-8b57-ed26fa6a68ec	Hypertensive Crisis	Systolic Blood Pressure spiked to 500.	high	t	2026-05-17 19:10:32.697094
84321161-6ac9-43e6-8320-539ef5f00bf7	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 2 of Paracetamol for the morning dose.	medium	t	2026-05-18 14:46:01.692278
0e0a968d-fd28-40c6-882b-c4488438752e	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 2 of Paracetamol for the evening dose.	medium	t	2026-05-18 23:20:01.500685
6d939273-5437-459b-8389-400767e3efe8	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 2 of Paracetamol for the morning dose.	medium	f	2026-05-29 01:48:25.958251
a7e27723-7c39-4551-92df-1078092c4714	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 2 of Paracetamol for the evening dose.	medium	f	2026-05-29 01:48:26.022479
b083e73d-f22b-4680-8c63-cbaffa3ca33f	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 2 of Paracetamol for the morning dose.	medium	f	2026-05-29 01:48:26.043416
fc205732-79b6-4688-95b1-45ce822c7f08	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 2 of Paracetamol for the evening dose.	medium	f	2026-05-29 01:48:26.140297
08a98248-c262-4093-83c0-74855c00d1af	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 2 of Paracetamol for the morning dose.	medium	f	2026-05-29 01:48:26.156394
332ee434-8a88-41e6-8c14-e8c8445c1f12	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 2 of Paracetamol for the evening dose.	medium	f	2026-05-29 01:48:26.163327
e5041a7b-c251-4e77-a1b8-bfe2bb067597	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 2 of Paracetamol for the morning dose.	medium	f	2026-05-29 01:48:26.169708
2a6ba06f-6f86-4cec-a682-972f2f1d5bdb	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 2 of Paracetamol for the evening dose.	medium	f	2026-05-29 01:48:26.176428
43ea8829-5c70-44c0-b895-6f9723622d1f	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 2 of Paracetamol for the morning dose.	medium	f	2026-05-29 01:48:26.183386
1d382817-56ea-4116-bbdd-e03ef27699c3	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 2 of Paracetamol for the evening dose.	medium	f	2026-05-29 01:48:26.189595
89357950-cb57-43aa-a990-3e027220f383	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 2 of Paracetamol for the morning dose.	medium	f	2026-05-29 01:48:26.195736
c9970d75-dd6e-42e2-8e91-cfa1b0dc2d50	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 2 of Paracetamol for the evening dose.	medium	f	2026-05-29 01:48:26.20171
8435570e-0888-481e-aceb-e60a30e8b6e3	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 4 of Ibuprofen for the morning dose.	medium	f	2026-05-29 01:48:26.20771
6fb96a3d-9f79-4d14-ba36-e7d068738952	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 2 of Paracetamol for the morning dose.	medium	f	2026-05-29 01:48:26.212666
07c843fd-5fe9-474f-b96b-039d93d7b936	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 1 of Ibuprofen for the evening dose.	medium	f	2026-05-29 01:48:26.218842
864ac8f2-4cfe-4297-8c22-174ea1974a9a	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 2 of Paracetamol for the evening dose.	medium	f	2026-05-29 01:48:26.224804
fd189f65-8b5a-4b75-878b-241007563a19	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 2 of Paracetamol for the morning dose.	medium	f	2026-05-29 01:48:26.230693
2b825785-d840-408a-a550-0e867bdfadf0	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 1 of Ibuprofen for the evening dose.	medium	f	2026-05-29 01:48:26.236758
cdaad377-2c47-468b-8bf6-93df7248a833	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 2 of Paracetamol for the evening dose.	medium	f	2026-05-29 01:48:26.243041
a7e21826-972e-406b-af71-d13619581e81	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 4 of Ibuprofen for the morning dose.	medium	f	2026-05-29 01:48:26.248343
c581ddc0-daed-4522-b076-cb379cae9152	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 2 of Paracetamol for the morning dose.	medium	f	2026-05-29 01:48:26.254648
33c61934-2acd-496d-b1a5-abb7e7721103	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 2 of Paracetamol for the evening dose.	medium	f	2026-05-29 01:48:26.259713
676e8288-d439-4ade-a37b-3b27ab82972e	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 1 of Ibuprofen for the evening dose.	medium	f	2026-05-29 01:48:26.266125
e55cf413-4e38-46e2-a678-a5db4cb94c3e	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 2 of Paracetamol for the morning dose.	medium	f	2026-05-29 01:48:26.273217
edd6f006-60dd-4b9e-a9ba-9bf2e4b8435d	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 4 of Ibuprofen for the morning dose.	medium	f	2026-05-29 01:48:26.278958
f0e76831-d4a3-4760-85b1-db9f017da3df	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 2 of Paracetamol for the evening dose.	medium	f	2026-05-29 01:48:26.28407
67fee18e-15d1-4591-b0f0-d4202b712caa	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	Missed Medication	You missed 1 of Ibuprofen for the evening dose.	medium	f	2026-05-29 01:48:26.30279
\.


--
-- TOC entry 5319 (class 0 OID 17044)
-- Dependencies: 223
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.appointments (appointment_id, patient_user_id, doctor_user_id, scheduled_at, duration_minutes, reason, status, notes, created_at) FROM stdin;
69d0a7cd-4783-4dbd-85c9-c0f19e8bd5b1	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	3b52f039-5e43-4858-92a0-f4d1019bab83	2026-05-02 04:51:04.648668	30	General Checkup	pending	\N	2026-04-24 23:07:53.604064
61c57d67-e48d-44c5-b4b8-3fc06d4a455d	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	8838004a-9915-4fe6-8d9b-69b126ba22b0	2026-04-25 13:01:15.889729	30	General Checkup	pending	\N	2026-04-24 23:07:53.604064
a355db0c-f573-41e8-9b95-9299590e3084	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	aa4a604a-6260-4568-a7be-afef4fcdcc83	2026-05-04 12:17:29.628414	30	General Checkup	pending	\N	2026-04-24 23:07:53.604064
9b54faf9-b382-4508-8614-ff20fbd03b92	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	6a9e8b60-5ce7-4965-b726-c3e1335ae80b	2026-05-03 05:22:46.302962	30	General Checkup	pending	\N	2026-04-24 23:07:53.604064
9a24c18e-5bff-4814-8547-2992dd5e33c4	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	31adc1f3-7294-48a4-bbae-158c72795028	2026-04-30 05:10:15.157036	30	General Checkup	pending	\N	2026-04-24 23:07:53.604064
3ce53aa6-78a6-4afc-888d-4b29634e565c	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	614b9904-f1c8-4f79-969a-b3af41f8002a	2026-04-29 08:22:06.797307	30	General Checkup	pending	\N	2026-04-24 23:07:53.604064
0e16172b-0c91-4399-aafb-3cfb2be654b5	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	7087e403-8596-4873-a4d7-6d259467701b	2026-05-01 23:28:36.69978	30	General Checkup	pending	\N	2026-04-24 23:07:53.604064
f5650692-d3d7-4aa8-a471-b9b69908c33f	194d097e-b430-4d5f-ae54-ca6ea35dd857	3b52f039-5e43-4858-92a0-f4d1019bab83	2026-04-25 23:23:19.658752	30	General Checkup	pending	\N	2026-04-24 23:07:53.604064
27dfff6b-b0d0-428d-b3c5-52c7c7f6d4ce	194d097e-b430-4d5f-ae54-ca6ea35dd857	8838004a-9915-4fe6-8d9b-69b126ba22b0	2026-05-01 23:33:03.31564	30	General Checkup	pending	\N	2026-04-24 23:07:53.604064
768dcfa3-0ea6-40e3-b1cd-488a5304b235	194d097e-b430-4d5f-ae54-ca6ea35dd857	aa4a604a-6260-4568-a7be-afef4fcdcc83	2026-04-30 12:54:49.028906	30	General Checkup	pending	\N	2026-04-24 23:07:53.604064
12e5fd79-11d3-4227-b4f1-1b9959ce9ecc	194d097e-b430-4d5f-ae54-ca6ea35dd857	6a9e8b60-5ce7-4965-b726-c3e1335ae80b	2026-04-25 01:49:35.713803	30	General Checkup	pending	\N	2026-04-24 23:07:53.604064
272679fd-6af6-491c-9385-64ab43547eff	194d097e-b430-4d5f-ae54-ca6ea35dd857	31adc1f3-7294-48a4-bbae-158c72795028	2026-04-27 02:20:40.717495	30	General Checkup	pending	\N	2026-04-24 23:07:53.604064
a1b4f436-262a-48e2-b3dc-37faa6a0fa54	194d097e-b430-4d5f-ae54-ca6ea35dd857	614b9904-f1c8-4f79-969a-b3af41f8002a	2026-04-29 02:37:48.321136	30	General Checkup	pending	\N	2026-04-24 23:07:53.604064
c69bce10-6856-4fcb-b056-4493e6780266	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	3b52f039-5e43-4858-92a0-f4d1019bab83	2026-05-10 14:30:00	30	Routine checkup and slight fever	pending	\N	2026-04-28 15:07:40.304398
c4cdd847-5ccb-4c54-82eb-cf39eb1f654a	c2eeabe0-8eb7-409b-b516-14d5c9baf425	d3db58b5-44b1-4b76-b335-99ffbabc71a4	2026-05-14 17:07:00	30	ZXCVBNM	pending	\N	2026-05-07 17:07:58.353881
cd1f0c9e-eb75-4055-b84c-d920dbacfa62	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-22 09:00:00	30	Testing	completed	\N	2026-05-17 12:00:44.971695
e5ceb070-447c-4d45-8375-d451e9189f60	e5acd622-2706-4a0d-8583-1870a1e82861	fe0fc54c-bf29-4430-852c-7f7cbfb17e85	2026-06-13 09:52:00	30	Hello	confirmed	\N	2026-05-10 14:52:54.782439
aa647fb0-fdb9-498b-a85b-029b9c1517c2	997621a6-b110-4f5e-bb09-573223cbcf39	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-24 09:00:00	30	Test	completed	\N	2026-05-18 16:57:04.153753
079e227a-c015-443c-b3fc-66dbac0642ec	c2987363-8e64-4dc2-84fd-1260b0b3bad6	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-17 09:00:00	30	Headache	completed	\N	2026-05-16 13:10:42.282482
12f3084a-1259-4d40-a1d3-72860ef84173	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	4a790890-5573-463a-aaf2-a2d32eefd04a	2026-06-13 18:58:00	60	Sugar	cancelled	\N	2026-05-14 23:59:14.996503
7e32b81d-033e-4fd7-874c-484e6204febf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-22 09:00:00	30	Testing	cancelled	\N	2026-05-17 09:57:19.040676
f68c8d87-3466-4c98-8e04-2bf07d64ce76	c2987363-8e64-4dc2-84fd-1260b0b3bad6	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-20 09:00:00	30	Nausea	completed	\N	2026-05-16 13:19:21.124315
bcabfce9-ff76-4d00-b965-0f9a2a486787	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	4a790890-5573-463a-aaf2-a2d32eefd04a	2026-05-14 23:26:00	30	dsadsa	cancelled	\N	2026-05-15 01:23:36.362207
067d54e3-672f-4874-86eb-2c605726fdd8	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	4a790890-5573-463a-aaf2-a2d32eefd04a	2026-05-15 04:00:00	30	follow up	cancelled	\N	2026-05-15 01:38:36.944159
f0458ea3-64ed-4d4d-9798-bd14fe328563	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	8713248d-073f-4ec7-949f-83ce0d2affb3	2026-05-23 09:00:00	30	Testing	confirmed	\N	2026-05-17 17:48:22.333046
f33af776-2ccd-4db3-a8ce-4a9ff1c62f64	c2987363-8e64-4dc2-84fd-1260b0b3bad6	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-21 09:00:00	30	Issue	completed	\N	2026-05-16 13:29:12.292962
003b6f0d-6a38-4748-9bb6-20b2174755ec	c2987363-8e64-4dc2-84fd-1260b0b3bad6	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-19 09:00:00	30	Consultation (Neurology)	confirmed	\N	2026-05-18 16:37:38.777042
19efbc18-2d73-48b4-866f-0547fcaf4892	997621a6-b110-4f5e-bb09-573223cbcf39	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-23 09:00:00	30	Hello	completed	\N	2026-05-18 22:59:22.252061
5ffbabe1-5950-4097-a027-b2cc4f2e09c2	997621a6-b110-4f5e-bb09-573223cbcf39	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-19 00:00:00	30	Hi	completed	\N	2026-05-18 23:45:22.059742
3d8a6cf6-3f50-49fa-ad8e-faa917de56ae	997621a6-b110-4f5e-bb09-573223cbcf39	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-19 00:30:00	30	Bye	confirmed	\N	2026-05-19 00:15:12.399577
\.


--
-- TOC entry 5335 (class 0 OID 17383)
-- Dependencies: 239
-- Data for Name: article_bookmarks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.article_bookmarks (bookmark_id, article_id, user_id, created_at) FROM stdin;
ab83d68a-9d5d-4632-b249-ab7f92ed9ffd	6fe1c85c-773d-4fca-b349-f21f16265fd3	4a790890-5573-463a-aaf2-a2d32eefd04a	2026-05-15 00:12:27.135627
80f70cbe-7ad8-4d37-a5a9-2a3c029235a2	6fe1c85c-773d-4fca-b349-f21f16265fd3	4a790890-5573-463a-aaf2-a2d32eefd04a	2026-05-15 00:12:27.917554
97fa48ee-3b97-4563-94f9-a2bf6899dc8c	b8743bc1-9507-4326-a06a-1101d514760e	4a790890-5573-463a-aaf2-a2d32eefd04a	2026-05-15 00:12:30.727394
0004eeca-56df-470b-8f36-27428143ddb9	b8743bc1-9507-4326-a06a-1101d514760e	4a790890-5573-463a-aaf2-a2d32eefd04a	2026-05-15 00:12:31.131758
b4adbe37-a4ea-40da-96a6-22028125e50b	6fe1c85c-773d-4fca-b349-f21f16265fd3	4a790890-5573-463a-aaf2-a2d32eefd04a	2026-05-15 00:38:22.85383
3ab7bb69-feb9-41f3-9065-24a3e050b56e	6fe1c85c-773d-4fca-b349-f21f16265fd3	4a790890-5573-463a-aaf2-a2d32eefd04a	2026-05-15 00:39:28.165084
fe030644-4f1a-4bb6-a165-f07386a09681	6fe1c85c-773d-4fca-b349-f21f16265fd3	4a790890-5573-463a-aaf2-a2d32eefd04a	2026-05-15 00:43:07.175288
15b3cbd1-e0c4-477a-85c0-a66244fefc8e	6fe1c85c-773d-4fca-b349-f21f16265fd3	4a790890-5573-463a-aaf2-a2d32eefd04a	2026-05-15 00:43:07.838463
9768e789-11a5-43a5-865b-e38075d598ff	b8743bc1-9507-4326-a06a-1101d514760e	4a790890-5573-463a-aaf2-a2d32eefd04a	2026-05-15 00:43:11.16586
b9609731-acdc-4368-921c-7374ca010216	b8743bc1-9507-4326-a06a-1101d514760e	4a790890-5573-463a-aaf2-a2d32eefd04a	2026-05-15 00:44:11.522779
1ac8893b-cc2b-4e68-9382-b486743cd1c8	6fe1c85c-773d-4fca-b349-f21f16265fd3	4a790890-5573-463a-aaf2-a2d32eefd04a	2026-05-15 00:44:12.802269
8786c30f-18bb-4e7b-a827-43c5bad3f996	6fe1c85c-773d-4fca-b349-f21f16265fd3	4a790890-5573-463a-aaf2-a2d32eefd04a	2026-05-15 00:48:11.595543
9963acf1-7517-4823-8e9f-0e7f41e51263	6fe1c85c-773d-4fca-b349-f21f16265fd3	4a790890-5573-463a-aaf2-a2d32eefd04a	2026-05-15 00:48:11.658934
00bef900-14a2-48b7-80ce-c45f611067b7	6fe1c85c-773d-4fca-b349-f21f16265fd3	4a790890-5573-463a-aaf2-a2d32eefd04a	2026-05-15 01:22:43.500653
9f0c78f4-90d0-463c-ae8b-0cad34321b58	6fe1c85c-773d-4fca-b349-f21f16265fd3	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-15 01:25:04.103731
ced2fa13-83a8-4eb8-8ce3-575a887ec743	6fe1c85c-773d-4fca-b349-f21f16265fd3	c2987363-8e64-4dc2-84fd-1260b0b3bad6	2026-05-16 13:21:22.026051
4a86e329-5fc8-4198-abc8-c182f8a14515	61956bdd-6cf7-402b-9884-19445c023dcb	a2371b3a-284b-4f63-9255-cbeac57208d6	2026-05-17 09:50:52.304857
9d10ec51-681b-4fe3-9d13-ca807d51a1ab	36afe422-73c1-4312-b25d-b7083c2abd33	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-17 12:08:31.922528
40b75620-f50a-4177-b238-0fd6fcb82065	f4e4ed93-449c-47ca-833d-715cb13c337a	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-17 12:18:12.512622
11aa6a2c-d2cb-4a49-9a06-7e2eb300750b	0672ded7-5e3d-4234-8ee3-5ca5dfa8bb9f	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 12:22:25.409242
bf024fc5-61c3-4a05-ad0e-6383f7e60e79	b8743bc1-9507-4326-a06a-1101d514760e	8713248d-073f-4ec7-949f-83ce0d2affb3	2026-05-17 16:29:33.60746
8c3cf932-fdde-47a9-abce-9e6eb19064df	b8743bc1-9507-4326-a06a-1101d514760e	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-17 22:51:26.796156
7b93a8ef-3a9a-4097-a059-75aa1f4862a6	b8743bc1-9507-4326-a06a-1101d514760e	a2371b3a-284b-4f63-9255-cbeac57208d6	2026-05-17 23:24:33.857157
\.


--
-- TOC entry 5333 (class 0 OID 17344)
-- Dependencies: 237
-- Data for Name: article_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.article_comments (comment_id, article_id, user_id, body, status, created_at) FROM stdin;
64f8d01b-6ed8-4aad-86ca-511563f6f81c	f4e4ed93-449c-47ca-833d-715cb13c337a	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	Very helpful article	active	2026-04-28 16:16:19.867623
e4ae7ae0-9197-4376-b3de-f9bd418a1b75	f4e4ed93-449c-47ca-833d-715cb13c337a	194d097e-b430-4d5f-ae54-ca6ea35dd857	Very helpful article	active	2026-04-28 16:16:19.867623
c1e0f2e5-237c-407a-8834-5db26f118304	f4e4ed93-449c-47ca-833d-715cb13c337a	3b52f039-5e43-4858-92a0-f4d1019bab83	Very helpful article	active	2026-04-28 16:16:19.867623
da8b94aa-f699-4eec-b692-005e1cfc238e	f4e4ed93-449c-47ca-833d-715cb13c337a	8838004a-9915-4fe6-8d9b-69b126ba22b0	Very helpful article	active	2026-04-28 16:16:19.867623
42abbd1f-da75-409d-9c0e-fc54c15fc8e8	f4e4ed93-449c-47ca-833d-715cb13c337a	09f99c55-20e8-4e86-a7ba-01f655e26a6a	Very helpful article	active	2026-04-28 16:16:19.867623
bd026c0e-795e-421d-a90c-13cea602800e	f4e4ed93-449c-47ca-833d-715cb13c337a	87a8d557-d37a-4ade-bc34-978ef2c4a322	Very helpful article	active	2026-04-28 16:16:19.867623
91785178-5a6b-4471-9afc-a4c3a5f5e838	f4e4ed93-449c-47ca-833d-715cb13c337a	0cfb955b-5284-4ed0-bbcc-2f29085cf65e	Very helpful article	active	2026-04-28 16:16:19.867623
84e44c61-7bac-424c-893c-f1116df8a2f7	f4e4ed93-449c-47ca-833d-715cb13c337a	aa4a604a-6260-4568-a7be-afef4fcdcc83	Very helpful article	active	2026-04-28 16:16:19.867623
9da3a180-24e6-41f6-91ac-4f2ed9c94330	f4e4ed93-449c-47ca-833d-715cb13c337a	20a16369-e2ab-403e-a650-e1bd3fd0090a	Very helpful article	active	2026-04-28 16:16:19.867623
8ebe4e6c-297f-44dc-93fd-22550571d6b1	f4e4ed93-449c-47ca-833d-715cb13c337a	6a9e8b60-5ce7-4965-b726-c3e1335ae80b	Very helpful article	active	2026-04-28 16:16:19.867623
a279ce94-0110-4357-ae30-f8a532fab1c2	aec4e7b5-bb48-48a2-8847-04ed56dd615c	1375627f-98f3-47d0-9e68-3e92b69cf5f3	sdfdsf	active	2026-05-17 12:19:09.047689
1fbb102d-a08c-4d4c-8b06-4912a136b2e7	aec4e7b5-bb48-48a2-8847-04ed56dd615c	1375627f-98f3-47d0-9e68-3e92b69cf5f3	fdsfs	active	2026-05-17 12:19:14.1053
8abf9b25-c07b-4d9e-9e22-32d9d2bc005a	b8743bc1-9507-4326-a06a-1101d514760e	8713248d-073f-4ec7-949f-83ce0d2affb3	Good tips	active	2026-05-17 16:32:15.505259
22672b86-e663-476d-b3bc-9ba2ccfedcc3	6fe1c85c-773d-4fca-b349-f21f16265fd3	8713248d-073f-4ec7-949f-83ce0d2affb3	Hi	active	2026-05-17 16:37:43.101214
1673b9c2-78f9-4455-89c0-c1c802025279	6fe1c85c-773d-4fca-b349-f21f16265fd3	8713248d-073f-4ec7-949f-83ce0d2affb3	comment	active	2026-05-17 16:38:23.211285
11a98a8e-2f41-4304-b40d-495b0d9a56bc	6fe1c85c-773d-4fca-b349-f21f16265fd3	8713248d-073f-4ec7-949f-83ce0d2affb3	Hi	active	2026-05-17 16:40:22.352252
c98fd13e-b4a3-43ec-a2f0-12e205b28e98	6fe1c85c-773d-4fca-b349-f21f16265fd3	8713248d-073f-4ec7-949f-83ce0d2affb3	Hi	active	2026-05-17 16:46:14.709539
bfda7819-824b-4474-baba-56482789310c	6fe1c85c-773d-4fca-b349-f21f16265fd3	8713248d-073f-4ec7-949f-83ce0d2affb3	Hi	active	2026-05-17 16:46:40.752321
bd5c83c9-ab34-47b3-9404-7bc991f86370	b8743bc1-9507-4326-a06a-1101d514760e	8713248d-073f-4ec7-949f-83ce0d2affb3	Hi	active	2026-05-17 16:48:31.816911
cb729289-99c4-48c0-a075-25b07364fc00	46357330-32d7-4914-af33-1682874b2c91	8713248d-073f-4ec7-949f-83ce0d2affb3	Hello	active	2026-05-17 16:48:41.57727
1f509ebb-994f-4519-a7a6-9167b9a5fb58	36afe422-73c1-4312-b25d-b7083c2abd33	8713248d-073f-4ec7-949f-83ce0d2affb3	Hi	active	2026-05-17 16:49:57.128037
8bc0f8ba-32bd-4114-876a-cb46463cb429	6fe1c85c-773d-4fca-b349-f21f16265fd3	8713248d-073f-4ec7-949f-83ce0d2affb3	Hi	active	2026-05-17 16:50:12.114379
374f73f2-4603-4e59-a6c0-3968e4fa976a	5fa43257-b793-44b2-ac9b-ba9ceaae51ea	8713248d-073f-4ec7-949f-83ce0d2affb3	Hi	active	2026-05-17 18:07:08.171446
f9136416-ef40-4483-a219-967632a52c42	b8743bc1-9507-4326-a06a-1101d514760e	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Hi	active	2026-05-18 14:46:30.327411
eb9ae000-b2d0-4d9a-8435-f19b2a925bc2	b8743bc1-9507-4326-a06a-1101d514760e	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Hi	active	2026-05-18 14:54:16.893109
35eb63e0-24b7-4894-bfdc-b1d0ecf40d54	aec4e7b5-bb48-48a2-8847-04ed56dd615c	997621a6-b110-4f5e-bb09-573223cbcf39	Hi	active	2026-05-18 16:56:16.77423
\.


--
-- TOC entry 5334 (class 0 OID 17365)
-- Dependencies: 238
-- Data for Name: article_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.article_likes (like_id, article_id, user_id, created_at) FROM stdin;
791e5bdd-bd76-4217-b14e-cab3bcae08fa	f4e4ed93-449c-47ca-833d-715cb13c337a	e5acd622-2706-4a0d-8583-1870a1e82861	2026-05-10 14:51:57.038626
14916f11-d984-4401-85a6-03ed54e317a9	46357330-32d7-4914-af33-1682874b2c91	a2371b3a-284b-4f63-9255-cbeac57208d6	2026-05-14 16:46:59.646293
105aa147-2da9-4de7-812d-f5fb321253e1	5fa43257-b793-44b2-ac9b-ba9ceaae51ea	a2371b3a-284b-4f63-9255-cbeac57208d6	2026-05-14 16:47:15.316781
12d09c26-4e4e-4b08-9369-1a46fd3aa8bc	49f9b855-482a-4e03-846d-76f31055326e	a2371b3a-284b-4f63-9255-cbeac57208d6	2026-05-14 16:51:26.080354
73bde9a1-da22-4ae2-b7a5-8842bd42d633	0672ded7-5e3d-4234-8ee3-5ca5dfa8bb9f	a2371b3a-284b-4f63-9255-cbeac57208d6	2026-05-14 16:59:22.200055
957388ba-d6f9-4bf1-bf9a-86ba24253378	61956bdd-6cf7-402b-9884-19445c023dcb	a2371b3a-284b-4f63-9255-cbeac57208d6	2026-05-14 17:05:43.092255
6b3e854d-5eb7-4c85-993e-0f26b918b681	9a6ae955-7362-425e-ad0c-c2c0ad946edf	a2371b3a-284b-4f63-9255-cbeac57208d6	2026-05-14 17:09:15.29477
086d3f2f-ffff-4836-acb0-fd85f860dd8d	b8743bc1-9507-4326-a06a-1101d514760e	a2371b3a-284b-4f63-9255-cbeac57208d6	2026-05-14 23:16:08.473678
8bfada73-6633-4467-8b9d-6fb5a877d9c0	3cfe6612-3051-419f-b42b-f10204673584	a2371b3a-284b-4f63-9255-cbeac57208d6	2026-05-14 23:16:47.347911
5e6840e3-6824-4240-8f4f-75f74f4e5975	36afe422-73c1-4312-b25d-b7083c2abd33	a2371b3a-284b-4f63-9255-cbeac57208d6	2026-05-14 23:17:07.566605
37497759-d7a9-47a0-99ab-4aaf019f60c4	49f9b855-482a-4e03-846d-76f31055326e	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-14 23:50:15.122925
952f6554-e21f-476a-a769-e5dffd872d1c	f4e4ed93-449c-47ca-833d-715cb13c337a	4a790890-5573-463a-aaf2-a2d32eefd04a	2026-05-15 00:07:43.833769
dd143684-a192-477e-bb7e-65936bafbb38	46357330-32d7-4914-af33-1682874b2c91	4a790890-5573-463a-aaf2-a2d32eefd04a	2026-05-15 00:07:44.003075
7a453532-350d-4f64-8ad3-bd27fb8d8f5b	5fa43257-b793-44b2-ac9b-ba9ceaae51ea	4a790890-5573-463a-aaf2-a2d32eefd04a	2026-05-15 00:07:44.172523
6bbf215f-859a-4dfd-baff-dcb771665610	0672ded7-5e3d-4234-8ee3-5ca5dfa8bb9f	4a790890-5573-463a-aaf2-a2d32eefd04a	2026-05-15 00:07:44.387352
1627faeb-a6f5-41d4-8d1f-9046262d242b	61956bdd-6cf7-402b-9884-19445c023dcb	4a790890-5573-463a-aaf2-a2d32eefd04a	2026-05-15 00:07:44.919624
72c1c362-ffc3-4261-806e-6a1f0ea50cd2	3cfe6612-3051-419f-b42b-f10204673584	4a790890-5573-463a-aaf2-a2d32eefd04a	2026-05-15 00:07:47.21301
13787fb4-e8be-4ea3-bd5d-5398b37dc36c	6fe1c85c-773d-4fca-b349-f21f16265fd3	4a790890-5573-463a-aaf2-a2d32eefd04a	2026-05-15 00:12:12.616325
55d5f34e-0879-4fc4-ac49-fdb6fbe60800	6fe1c85c-773d-4fca-b349-f21f16265fd3	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-15 01:25:10.768794
f37d5f9f-691d-485a-bf14-0849016372f9	6fe1c85c-773d-4fca-b349-f21f16265fd3	e8faf053-fc7b-4cd4-8cfe-bffe7d95d30a	2026-05-15 01:40:35.842003
f5bd7549-d61e-4bfd-9075-3f4b15536545	6fe1c85c-773d-4fca-b349-f21f16265fd3	c2987363-8e64-4dc2-84fd-1260b0b3bad6	2026-05-16 13:21:19.477817
ca2298dd-3c99-4f85-8988-349b7a5b6a3b	61956bdd-6cf7-402b-9884-19445c023dcb	e8faf053-fc7b-4cd4-8cfe-bffe7d95d30a	2026-05-17 09:54:48.103595
5526ac44-92ac-480c-8447-6110903ef0f0	3cfe6612-3051-419f-b42b-f10204673584	e8faf053-fc7b-4cd4-8cfe-bffe7d95d30a	2026-05-17 09:54:57.778889
ec0c6238-b011-4cd8-aadf-a4177fcf2502	61956bdd-6cf7-402b-9884-19445c023dcb	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 10:09:51.225817
234ebccf-6f95-4e1e-991e-e8c2b1830db1	3cfe6612-3051-419f-b42b-f10204673584	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 10:11:06.906314
2c754613-c6d2-4342-b109-fdaedef9a1bf	5fa43257-b793-44b2-ac9b-ba9ceaae51ea	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 10:11:24.671772
d7425051-c22e-4fd0-8484-d5308b507839	46357330-32d7-4914-af33-1682874b2c91	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 10:11:27.603752
5e0f29aa-ed6e-4d04-8613-40795305593a	36afe422-73c1-4312-b25d-b7083c2abd33	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 10:11:33.762829
46235c8d-c9a5-4df7-b185-0a7fa893e913	9a6ae955-7362-425e-ad0c-c2c0ad946edf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 10:11:35.255664
028b3042-a7b7-435b-844d-af87375b7ac7	0672ded7-5e3d-4234-8ee3-5ca5dfa8bb9f	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 10:11:38.217413
673d4e9d-468b-44c0-a171-aa5e1cd9f418	6fe1c85c-773d-4fca-b349-f21f16265fd3	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-17 10:17:43.775256
5d30a848-b404-4e00-9465-0f8edd8e8f14	b8743bc1-9507-4326-a06a-1101d514760e	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 10:36:35.967327
4d958430-6cbd-450f-94af-41037742888a	b8743bc1-9507-4326-a06a-1101d514760e	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-17 12:08:28.945698
198f37d7-3aa7-412e-ab7b-e4ea941d36df	36afe422-73c1-4312-b25d-b7083c2abd33	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-17 12:08:38.851672
0b3d6c3e-9fa4-4851-9541-4231755c5171	49f9b855-482a-4e03-846d-76f31055326e	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-17 12:13:26.849544
89817654-fe7e-48c9-bb09-74eea3375a4d	f4e4ed93-449c-47ca-833d-715cb13c337a	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-17 12:18:08.274758
129baab5-7b16-4569-807c-4cc087d69f38	f4e4ed93-449c-47ca-833d-715cb13c337a	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 12:37:29.566879
8cfd809d-9779-4e1e-87ef-2d059dc6d80f	5fa43257-b793-44b2-ac9b-ba9ceaae51ea	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-17 12:41:20.924951
b413889e-243f-4908-9a2c-e2ed22ef8227	0672ded7-5e3d-4234-8ee3-5ca5dfa8bb9f	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-17 12:41:25.028683
02bdd6ec-a792-4b45-913b-c8ba0db2dd86	6fe1c85c-773d-4fca-b349-f21f16265fd3	8713248d-073f-4ec7-949f-83ce0d2affb3	2026-05-17 16:29:30.238074
daf66f3f-7c9f-45d2-9c07-969171bb6373	5fa43257-b793-44b2-ac9b-ba9ceaae51ea	8713248d-073f-4ec7-949f-83ce0d2affb3	2026-05-17 18:07:09.906534
9cd748ac-ef24-4819-990a-26dd773c6327	46357330-32d7-4914-af33-1682874b2c91	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-17 22:51:32.860991
4480e582-478d-43a6-83e6-328ea4c7e9e8	f4e4ed93-449c-47ca-833d-715cb13c337a	a2371b3a-284b-4f63-9255-cbeac57208d6	2026-05-17 23:24:28.349675
37afc23c-e602-41ce-bec3-32e6a8033f2c	b8743bc1-9507-4326-a06a-1101d514760e	e8faf053-fc7b-4cd4-8cfe-bffe7d95d30a	2026-05-17 23:25:32.076022
719756dd-09d6-4232-a518-f9472f993c3d	5fa43257-b793-44b2-ac9b-ba9ceaae51ea	e8faf053-fc7b-4cd4-8cfe-bffe7d95d30a	2026-05-17 23:25:50.111959
dda284cb-c6ad-404e-b2e6-08ce571c4c21	61956bdd-6cf7-402b-9884-19445c023dcb	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-17 23:27:23.78062
6dfbf842-d297-47d8-8aec-099a732d3a76	b8743bc1-9507-4326-a06a-1101d514760e	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-18 16:55:59.386065
842ccf18-2973-431a-8b0f-c63225430f67	5fa43257-b793-44b2-ac9b-ba9ceaae51ea	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-18 16:56:03.141061
e19871bc-e35b-42b1-9d30-360ca1b4b8fe	36afe422-73c1-4312-b25d-b7083c2abd33	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-18 16:56:05.94977
4a98f00a-8767-46c7-836e-ea9fa21bfc2c	61956bdd-6cf7-402b-9884-19445c023dcb	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-18 16:56:07.309611
\.


--
-- TOC entry 5332 (class 0 OID 17327)
-- Dependencies: 236
-- Data for Name: blog_articles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blog_articles (article_id, author_user_id, title, body, cover_image, category, status, likes_count, published_at, created_at) FROM stdin;
aec4e7b5-bb48-48a2-8847-04ed56dd615c	1375627f-98f3-47d0-9e68-3e92b69cf5f3	Test	Test		Test	active	0	2026-05-18 15:23:27.533876	2026-05-17 12:18:52.307985
3c9821da-607c-4e07-b0ae-66b4ff1e3929	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	asdads	fasfdasdas	\N	asdasdasdsa	deleted	0	\N	2026-05-17 23:35:05.800695
2881589b-7740-4d10-bfaa-a4461e71643a	a2371b3a-284b-4f63-9255-cbeac57208d6	Add karo	jaldi karo	\N	\N	active	0	2026-05-18 17:06:21.303	2026-05-18 17:06:21.31027
9a6ae955-7362-425e-ad0c-c2c0ad946edf	0cfb955b-5284-4ed0-bbcc-2f29085cf65e	Health Tips	Drink water and exercise daily	\N	Wellness	active	2	\N	2026-04-28 16:16:19.867623
b8743bc1-9507-4326-a06a-1101d514760e	aa4a604a-6260-4568-a7be-afef4fcdcc83	Health Tips	Drink water and exercise daily	\N	Wellness	active	1	\N	2026-04-28 16:16:19.867623
36afe422-73c1-4312-b25d-b7083c2abd33	20a16369-e2ab-403e-a650-e1bd3fd0090a	Health Tips	Drink water and exercise daily	\N	Wellness	active	1	\N	2026-04-28 16:16:19.867623
49f9b855-482a-4e03-846d-76f31055326e	8838004a-9915-4fe6-8d9b-69b126ba22b0	Health Tips	Drink water and exercise daily	\N	Wellness	active	5	\N	2026-04-28 16:16:19.867623
f4e4ed93-449c-47ca-833d-715cb13c337a	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	Health Tips	Drink water and exercise daily	\N	Wellness	active	2	\N	2026-04-28 16:16:19.867623
46357330-32d7-4914-af33-1682874b2c91	194d097e-b430-4d5f-ae54-ca6ea35dd857	Health Tips	Drink water and exercise daily	\N	Wellness	active	5	\N	2026-04-28 16:16:19.867623
5fa43257-b793-44b2-ac9b-ba9ceaae51ea	3b52f039-5e43-4858-92a0-f4d1019bab83	Health Tips	Drink water and exercise daily	\N	Wellness	active	10	\N	2026-04-28 16:16:19.867623
0672ded7-5e3d-4234-8ee3-5ca5dfa8bb9f	09f99c55-20e8-4e86-a7ba-01f655e26a6a	Health Tips	Drink water and exercise daily	\N	Wellness	active	3	\N	2026-04-28 16:16:19.867623
61956bdd-6cf7-402b-9884-19445c023dcb	87a8d557-d37a-4ade-bc34-978ef2c4a322	Health Tips	Drink water and exercise daily	\N	Wellness	active	2	\N	2026-04-28 16:16:19.867623
3cfe6612-3051-419f-b42b-f10204673584	a2371b3a-284b-4f63-9255-cbeac57208d6	asgdasj	fsdafvjashvdf	\N	\N	active	2	2026-05-14 23:16:36.522	2026-05-14 23:16:36.556142
6fe1c85c-773d-4fca-b349-f21f16265fd3	6a9e8b60-5ce7-4965-b726-c3e1335ae80b	Health Tips	Drink water and exercise daily	\N	Wellness	active	4	\N	2026-04-28 16:16:19.867623
84335193-f753-4310-9286-7105531f81d6	1375627f-98f3-47d0-9e68-3e92b69cf5f3	Test kar raha hoon	theek he yarrr	\N	test kamyab ho jaye ga ke nahi?	active	0	2026-05-18 15:17:25.793174	2026-05-18 15:08:54.4856
63352b83-a731-414e-a4d6-b9375c159aea	8713248d-073f-4ec7-949f-83ce0d2affb3	Koi bhi likh do	Dhang ka bana lo	\N	dash	deleted	0	\N	2026-05-17 16:29:18.942626
\.


--
-- TOC entry 5328 (class 0 OID 17244)
-- Dependencies: 232
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_messages (message_id, room_id, sender_id, message_text, is_read, sent_at) FROM stdin;
e258b8db-3ec6-46e1-8b55-d3661e41f9b6	89ab80a9-96aa-4c6b-8ba9-02830adf667f	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	Hello Doctor	f	2026-04-28 16:16:19.867623
4eddb115-d52c-4980-b8ba-96832706e11e	7112ea9d-29eb-48b5-8c73-659f3ddc97ce	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	Hello Doctor	f	2026-04-28 16:16:19.867623
d39ac9ae-64d6-4537-bbe2-94ca27cf534b	44791a9e-a61a-4d87-9362-629571d68b66	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	Hello Doctor	f	2026-04-28 16:16:19.867623
f5292834-7885-4f06-a492-1308b8cd367b	608e8466-db52-403c-8846-1f2c1e509dac	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	Hello Doctor	f	2026-04-28 16:16:19.867623
88d607ac-1315-4308-b77e-3a9c5cb07a78	18cec689-c3c3-40e0-954e-7e377be9b0f1	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	Hello Doctor	f	2026-04-28 16:16:19.867623
c2f2d481-7b5b-4d83-9769-662972352e66	f807a3ee-c2bf-411f-b98b-6966d3e028df	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	Hello Doctor	f	2026-04-28 16:16:19.867623
a2c23e38-1604-4207-9c33-c066eeb7da98	c556e8b4-2c9f-462a-a5fa-933e040e536c	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	Hello Doctor	f	2026-04-28 16:16:19.867623
8477c3d9-ef62-4bf4-af51-ec0bdbbf7147	cf59ba0d-aae9-42c6-a67b-da9e8bed0b6a	194d097e-b430-4d5f-ae54-ca6ea35dd857	Hello Doctor	f	2026-04-28 16:16:19.867623
5c997ac5-d01f-4350-b5d0-9a8302b6da64	c5cc5288-18c1-4056-9d93-9c479d4f434a	194d097e-b430-4d5f-ae54-ca6ea35dd857	Hello Doctor	f	2026-04-28 16:16:19.867623
7ddcf0e5-7222-4226-9788-a3e63d8f21c9	f9df0dca-8703-46e0-b997-e02f0ce6ebac	194d097e-b430-4d5f-ae54-ca6ea35dd857	Hello Doctor	f	2026-04-28 16:16:19.867623
0cbddcc5-d1f1-4aa1-bdfe-f7cb7d48f117	89ab80a9-96aa-4c6b-8ba9-02830adf667f	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	Hello Doctor, I have a question about my recent vitals alert.	f	2026-04-28 17:17:11.828018
88c0a84e-4392-48ae-a78e-485e8e5fa900	d1f748b7-6894-41a5-b57d-fc978bcaa044	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Hi consultant! My name is Isfa. I am having a glucose spike. Recommend me a doctor	t	2026-05-15 01:42:25.278133
64f836ae-c536-44cc-8fc2-66fee4388d35	48e5eb23-3889-4c6e-a30d-72f9cac4504b	c2987363-8e64-4dc2-84fd-1260b0b3bad6	Hi consultant	t	2026-05-16 16:05:51.295571
b482917e-85a6-41d0-b2ee-aed7da4821d8	0f732022-bb0d-49da-959e-01cab623c4df	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Hello Doctor Isfa!	t	2026-05-15 00:04:07.251938
f42b6608-8bed-4cc7-8437-a6aa3e44da2d	63be1ae5-fd55-4449-b870-b73bd487a307	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Hi	f	2026-05-17 18:07:38.143381
dd88327c-25b8-460b-acc1-25fa1e3bafeb	2d74a8f6-fdb6-4182-b1f7-3a5d5bfe3de8	e8faf053-fc7b-4cd4-8cfe-bffe7d95d30a	Hello Patient, I received your message. Let's start the consultation.	f	2026-05-16 16:37:31.992029
b3b2edae-3624-4554-8e2e-25d461ac10a6	24932eae-0f0f-473d-bcc7-24267ebf7292	3b52f039-5e43-4858-92a0-f4d1019bab83	Hello, reviewing your appointment.	f	2026-05-16 16:37:32.017712
74a9103b-8f94-462b-a2f8-cf103238ce6b	63be1ae5-fd55-4449-b870-b73bd487a307	8713248d-073f-4ec7-949f-83ce0d2affb3	Hi	t	2026-05-17 18:06:39.398382
2530fdff-b0ef-4afa-86b4-7472d7258253	74292aff-1bc5-4647-86a7-f8988aaa8b59	1375627f-98f3-47d0-9e68-3e92b69cf5f3	Hi! I am doctor	t	2026-05-16 16:40:14.362809
9f892c65-77f3-4404-87b1-65b380ae8f98	2d74a8f6-fdb6-4182-b1f7-3a5d5bfe3de8	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	Hello Consultant, this is a test message from Patient.	t	2026-05-16 16:37:31.983256
155d713e-d0fb-406a-a185-ec537ac6b6d4	74292aff-1bc5-4647-86a7-f8988aaa8b59	c2987363-8e64-4dc2-84fd-1260b0b3bad6	Hi Ahmed!	t	2026-05-16 16:39:13.925359
98713060-d59c-42ed-a907-ff3a9c0c362f	74292aff-1bc5-4647-86a7-f8988aaa8b59	c2987363-8e64-4dc2-84fd-1260b0b3bad6	Hi! I am patient	t	2026-05-17 09:49:54.104458
f415e451-4bb7-4041-ab50-e01addf8b6ef	9d0bf568-4355-403c-b824-bda4b2034b8f	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Hi Dr Ahmed! Accept my appointment	t	2026-05-17 09:57:45.37393
26f1876a-443d-4555-bd46-a479eb77bb93	d1f748b7-6894-41a5-b57d-fc978bcaa044	e8faf053-fc7b-4cd4-8cfe-bffe7d95d30a	You should go and book an appointment with doctor Isfa.	t	2026-05-15 01:43:11.679658
88878ba9-9b55-4ec6-ad38-3f7043c274f8	0f732022-bb0d-49da-959e-01cab623c4df	4a790890-5573-463a-aaf2-a2d32eefd04a	Hi patient Isfa!	t	2026-05-15 00:04:49.904401
91501750-3e96-40a8-adc1-9b3849f926bd	9d0bf568-4355-403c-b824-bda4b2034b8f	1375627f-98f3-47d0-9e68-3e92b69cf5f3	Hi	t	2026-05-17 22:51:20.386204
580e3d22-d94e-46fa-b73c-7980e4f9b258	9d0bf568-4355-403c-b824-bda4b2034b8f	1375627f-98f3-47d0-9e68-3e92b69cf5f3	Okay	t	2026-05-17 09:58:02.197326
\.


--
-- TOC entry 5327 (class 0 OID 17221)
-- Dependencies: 231
-- Data for Name: chat_rooms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_rooms (room_id, patient_user_id, doctor_user_id, consultant_user_id, room_type, created_at, last_message_at) FROM stdin;
7112ea9d-29eb-48b5-8c73-659f3ddc97ce	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	8838004a-9915-4fe6-8d9b-69b126ba22b0	\N	consultation	2026-04-28 16:16:19.867623	\N
44791a9e-a61a-4d87-9362-629571d68b66	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	aa4a604a-6260-4568-a7be-afef4fcdcc83	\N	consultation	2026-04-28 16:16:19.867623	\N
608e8466-db52-403c-8846-1f2c1e509dac	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	6a9e8b60-5ce7-4965-b726-c3e1335ae80b	\N	consultation	2026-04-28 16:16:19.867623	\N
18cec689-c3c3-40e0-954e-7e377be9b0f1	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	31adc1f3-7294-48a4-bbae-158c72795028	\N	consultation	2026-04-28 16:16:19.867623	\N
f807a3ee-c2bf-411f-b98b-6966d3e028df	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	614b9904-f1c8-4f79-969a-b3af41f8002a	\N	consultation	2026-04-28 16:16:19.867623	\N
c556e8b4-2c9f-462a-a5fa-933e040e536c	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	7087e403-8596-4873-a4d7-6d259467701b	\N	consultation	2026-04-28 16:16:19.867623	\N
cf59ba0d-aae9-42c6-a67b-da9e8bed0b6a	194d097e-b430-4d5f-ae54-ca6ea35dd857	3b52f039-5e43-4858-92a0-f4d1019bab83	\N	consultation	2026-04-28 16:16:19.867623	\N
c5cc5288-18c1-4056-9d93-9c479d4f434a	194d097e-b430-4d5f-ae54-ca6ea35dd857	8838004a-9915-4fe6-8d9b-69b126ba22b0	\N	consultation	2026-04-28 16:16:19.867623	\N
f9df0dca-8703-46e0-b997-e02f0ce6ebac	194d097e-b430-4d5f-ae54-ca6ea35dd857	aa4a604a-6260-4568-a7be-afef4fcdcc83	\N	consultation	2026-04-28 16:16:19.867623	\N
89ab80a9-96aa-4c6b-8ba9-02830adf667f	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	3b52f039-5e43-4858-92a0-f4d1019bab83	\N	consultation	2026-04-28 16:16:19.867623	2026-04-28 17:17:12.605559
6dde04ad-9f8d-4c53-9362-f4c29e79a356	e5acd622-2706-4a0d-8583-1870a1e82861	fe0fc54c-bf29-4430-852c-7f7cbfb17e85	\N	appointment	2026-05-10 14:52:54.846198	\N
0f732022-bb0d-49da-959e-01cab623c4df	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	4a790890-5573-463a-aaf2-a2d32eefd04a	\N	appointment	2026-05-14 23:59:15.040247	2026-05-15 00:04:49.914271
2b647d4a-5b12-4c4c-a42f-eafdd5aaa619	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	4a790890-5573-463a-aaf2-a2d32eefd04a	\N	consultation	2026-05-15 00:15:26.229775	\N
d1f748b7-6894-41a5-b57d-fc978bcaa044	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	e8faf053-fc7b-4cd4-8cfe-bffe7d95d30a	consultation	2026-05-15 01:41:51.092445	2026-05-15 01:43:11.687848
48e5eb23-3889-4c6e-a30d-72f9cac4504b	c2987363-8e64-4dc2-84fd-1260b0b3bad6	\N	e8faf053-fc7b-4cd4-8cfe-bffe7d95d30a	consultation	2026-05-16 13:21:36.169502	2026-05-16 16:05:51.491369
2d74a8f6-fdb6-4182-b1f7-3a5d5bfe3de8	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	\N	e8faf053-fc7b-4cd4-8cfe-bffe7d95d30a	consultation	2026-05-16 16:37:31.958478	2026-05-16 16:37:31.99403
24932eae-0f0f-473d-bcc7-24267ebf7292	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	3b52f039-5e43-4858-92a0-f4d1019bab83	\N	appointment	2026-05-16 16:37:32.015943	2026-05-16 16:37:32.02094
74292aff-1bc5-4647-86a7-f8988aaa8b59	c2987363-8e64-4dc2-84fd-1260b0b3bad6	1375627f-98f3-47d0-9e68-3e92b69cf5f3	\N	appointment	2026-05-16 16:39:13.888566	2026-05-17 09:49:54.258669
63be1ae5-fd55-4449-b870-b73bd487a307	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	8713248d-073f-4ec7-949f-83ce0d2affb3	\N	appointment	2026-05-17 17:48:22.370311	2026-05-17 18:07:38.150649
9d0bf568-4355-403c-b824-bda4b2034b8f	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	1375627f-98f3-47d0-9e68-3e92b69cf5f3	\N	appointment	2026-05-17 09:57:19.067962	2026-05-17 22:51:20.392989
4a103a58-1599-4b43-92d2-9ac0c35507fd	997621a6-b110-4f5e-bb09-573223cbcf39	1375627f-98f3-47d0-9e68-3e92b69cf5f3	\N	appointment	2026-05-18 16:57:04.181435	\N
\.


--
-- TOC entry 5337 (class 0 OID 17508)
-- Dependencies: 241
-- Data for Name: doctor_availability; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_availability (availability_id, doctor_user_id, day_of_week, start_time, end_time, created_at, updated_at) FROM stdin;
a8cb94f8-105a-4aea-816c-ee8aef8972d9	4a790890-5573-463a-aaf2-a2d32eefd04a	Friday	09:00:00	10:00:00	2026-05-15 01:37:52.412533	2026-05-15 01:37:52.412533
e53360cc-68e4-4a4b-adf1-b3b769d8a0f5	8713248d-073f-4ec7-949f-83ce0d2affb3	Saturday	09:00:00	09:30:00	2026-05-17 16:28:31.198894	2026-05-17 16:28:31.198894
330f63be-c82b-4baf-bf8f-7555c7da3f43	8713248d-073f-4ec7-949f-83ce0d2affb3	Friday	09:00:00	09:30:00	2026-05-17 16:28:44.32949	2026-05-17 16:28:44.32949
3b626485-2b60-4741-a0e7-2bfb740d30b9	1375627f-98f3-47d0-9e68-3e92b69cf5f3	Saturday	09:00:00	09:30:00	2026-05-18 22:58:39.689837	2026-05-18 22:58:39.689837
f5fa9554-dc7c-43c0-9446-ff104895f1ce	1375627f-98f3-47d0-9e68-3e92b69cf5f3	Sunday	09:00:00	09:30:00	2026-05-18 22:58:44.703898	2026-05-18 22:58:44.703898
de014224-8837-4476-9deb-ca54d0c99c65	1375627f-98f3-47d0-9e68-3e92b69cf5f3	Tuesday	00:00:00	00:30:00	2026-05-18 23:44:53.611072	2026-05-18 23:44:53.611072
6010d62b-861d-4b99-b669-018c406d1b42	1375627f-98f3-47d0-9e68-3e92b69cf5f3	Tuesday	00:30:00	01:00:00	2026-05-19 00:13:53.18412	2026-05-19 00:13:53.18412
\.


--
-- TOC entry 5339 (class 0 OID 17575)
-- Dependencies: 243
-- Data for Name: forum_post_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.forum_post_likes (like_id, post_id, user_id, created_at) FROM stdin;
1	cf46e3f4-3ba1-4e3a-bdb3-e431a5012123	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 11:54:49.204495+05
2	8873ee28-167d-44f7-bdd5-dc8c30545008	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 11:54:56.810168+05
3	ada224ba-af3c-4430-b632-747deb81ebfa	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-17 11:55:36.173366+05
4	0c89c255-e803-4401-8571-9522256de704	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-17 11:58:44.700401+05
5	e4c9e077-45a9-40bc-955b-bc6faf930748	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-17 12:19:21.880889+05
6	0c89c255-e803-4401-8571-9522256de704	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 12:23:08.864458+05
7	12085e84-92db-4fe5-a731-a047d4644cbd	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 12:23:21.075325+05
8	2b60dfe8-ddad-421d-97e6-60756cd97cde	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 12:23:31.674445+05
9	28f29585-38f2-4410-890e-7f479092e2bd	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 12:23:33.118922+05
10	895df9ab-7067-4a88-9767-eafe5c928430	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 12:23:34.525646+05
11	ada224ba-af3c-4430-b632-747deb81ebfa	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 12:24:33.965088+05
12	c8880b83-1948-4bb9-9f94-d84e6a65bb31	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 12:25:14.460211+05
13	7b1a3852-6233-472b-8b6f-0c0abc36ffeb	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 12:25:17.281415+05
14	652f15a8-aaab-48de-bd65-2b689e38d7cd	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 12:25:46.8593+05
15	895df9ab-7067-4a88-9767-eafe5c928430	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-17 12:38:00.304698+05
16	cf46e3f4-3ba1-4e3a-bdb3-e431a5012123	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-17 12:38:27.014086+05
17	c8880b83-1948-4bb9-9f94-d84e6a65bb31	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-17 12:41:32.063309+05
18	652f15a8-aaab-48de-bd65-2b689e38d7cd	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-17 12:41:33.89524+05
19	ada224ba-af3c-4430-b632-747deb81ebfa	8713248d-073f-4ec7-949f-83ce0d2affb3	2026-05-17 16:53:53.005016+05
20	958cd013-bcab-494a-beb0-bf61bfa0f6f9	8713248d-073f-4ec7-949f-83ce0d2affb3	2026-05-17 16:54:40.798253+05
21	12085e84-92db-4fe5-a731-a047d4644cbd	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-17 22:51:42.330612+05
22	958cd013-bcab-494a-beb0-bf61bfa0f6f9	a2371b3a-284b-4f63-9255-cbeac57208d6	2026-05-17 23:24:10.998968+05
23	ada224ba-af3c-4430-b632-747deb81ebfa	a2371b3a-284b-4f63-9255-cbeac57208d6	2026-05-29 01:40:55.219076+05
\.


--
-- TOC entry 5329 (class 0 OID 17266)
-- Dependencies: 233
-- Data for Name: forum_posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.forum_posts (post_id, user_id, category, title, body, status, views_count, created_at, updated_at, likes_count) FROM stdin;
2b60dfe8-ddad-421d-97e6-60756cd97cde	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	Health	How to reduce fever?	Need advice for fever treatment	active	0	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	0
28f29585-38f2-4410-890e-7f479092e2bd	3b52f039-5e43-4858-92a0-f4d1019bab83	Health	How to reduce fever?	Need advice for fever treatment	active	0	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	0
c8880b83-1948-4bb9-9f94-d84e6a65bb31	87a8d557-d37a-4ade-bc34-978ef2c4a322	Health	How to reduce fever?	Need advice for fever treatment	active	0	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	0
7b1a3852-6233-472b-8b6f-0c0abc36ffeb	aa4a604a-6260-4568-a7be-afef4fcdcc83	Health	How to reduce fever?	Need advice for fever treatment	active	0	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	0
958cd013-bcab-494a-beb0-bf61bfa0f6f9	8713248d-073f-4ec7-949f-83ce0d2affb3	Add karo	Forum add karo	Jaldi karo	active	10	2026-05-17 16:54:38.046233	2026-05-17 16:54:38.046233	0
5665befd-a453-488f-af2a-0bc47529d948	fe0fc54c-bf29-4430-852c-7f7cbfb17e85	\N	asasd	dsasdads	active	5	2026-05-10 12:45:21.448066	2026-05-18 17:08:15.891088	0
8873ee28-167d-44f7-bdd5-dc8c30545008	0cfb955b-5284-4ed0-bbcc-2f29085cf65e	Health	How to reduce fever?	Need advice for fever treatment	active	1	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	0
895df9ab-7067-4a88-9767-eafe5c928430	09f99c55-20e8-4e86-a7ba-01f655e26a6a	Health	How to reduce fever?	Need advice for fever treatment	active	1	2026-04-28 16:16:19.867623	2026-05-08 00:27:07.184044	0
652f15a8-aaab-48de-bd65-2b689e38d7cd	194d097e-b430-4d5f-ae54-ca6ea35dd857	Health	How to reduce fever?	Need advice for fever treatment	active	1	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	0
cf46e3f4-3ba1-4e3a-bdb3-e431a5012123	20a16369-e2ab-403e-a650-e1bd3fd0090a	Health	How to reduce fever?	Need advice for fever treatment	active	1	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	0
12085e84-92db-4fe5-a731-a047d4644cbd	8838004a-9915-4fe6-8d9b-69b126ba22b0	Health	How to reduce fever?	Need advice for fever treatment	active	1	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	0
0c89c255-e803-4401-8571-9522256de704	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	General Advice	What are the best stretches for lower back pain?	I've been sitting at my desk a lot lately and my lower back is killing me. Any safe stretches you recommend?	active	3	2026-04-28 17:43:04.049207	2026-05-08 00:26:46.460923	0
e4c9e077-45a9-40bc-955b-bc6faf930748	6a9e8b60-5ce7-4965-b726-c3e1335ae80b	Health	How to reduce fever?	Need advice for fever treatment	active	1	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	0
ada224ba-af3c-4430-b632-747deb81ebfa	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Failure	Heart	Heart attack	active	13	2026-05-14 23:55:12.537412	2026-05-14 23:55:12.537412	0
\.


--
-- TOC entry 5330 (class 0 OID 17284)
-- Dependencies: 234
-- Data for Name: forum_replies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.forum_replies (reply_id, post_id, user_id, body, is_accepted, status, created_at) FROM stdin;
19b338a6-58f8-4671-9797-1f918928f91f	2b60dfe8-ddad-421d-97e6-60756cd97cde	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	Take rest and drink fluids	f	active	2026-04-28 16:16:19.867623
103d8fcc-bd39-440b-9f51-60d402dce1c4	2b60dfe8-ddad-421d-97e6-60756cd97cde	194d097e-b430-4d5f-ae54-ca6ea35dd857	Take rest and drink fluids	f	active	2026-04-28 16:16:19.867623
fe696590-5e0c-442f-a65c-e371d0ab8076	2b60dfe8-ddad-421d-97e6-60756cd97cde	3b52f039-5e43-4858-92a0-f4d1019bab83	Take rest and drink fluids	f	active	2026-04-28 16:16:19.867623
4a8bf056-b161-485e-a4ef-f08c52cb1864	2b60dfe8-ddad-421d-97e6-60756cd97cde	8838004a-9915-4fe6-8d9b-69b126ba22b0	Take rest and drink fluids	f	active	2026-04-28 16:16:19.867623
79dd61b7-0d45-4d69-9d60-390928b7023f	2b60dfe8-ddad-421d-97e6-60756cd97cde	09f99c55-20e8-4e86-a7ba-01f655e26a6a	Take rest and drink fluids	f	active	2026-04-28 16:16:19.867623
d950dc9c-b921-4bf4-992d-c610a050114d	2b60dfe8-ddad-421d-97e6-60756cd97cde	87a8d557-d37a-4ade-bc34-978ef2c4a322	Take rest and drink fluids	f	active	2026-04-28 16:16:19.867623
f703445c-60de-4666-8af9-208cbf96e8d9	2b60dfe8-ddad-421d-97e6-60756cd97cde	0cfb955b-5284-4ed0-bbcc-2f29085cf65e	Take rest and drink fluids	f	active	2026-04-28 16:16:19.867623
fc876497-3c4e-43fd-982e-837002e900e0	2b60dfe8-ddad-421d-97e6-60756cd97cde	aa4a604a-6260-4568-a7be-afef4fcdcc83	Take rest and drink fluids	f	active	2026-04-28 16:16:19.867623
334c3e1d-e014-4b9d-93ac-853f6a2f39ef	2b60dfe8-ddad-421d-97e6-60756cd97cde	20a16369-e2ab-403e-a650-e1bd3fd0090a	Take rest and drink fluids	f	active	2026-04-28 16:16:19.867623
3872577f-1dee-42d3-970c-074c25e46548	2b60dfe8-ddad-421d-97e6-60756cd97cde	6a9e8b60-5ce7-4965-b726-c3e1335ae80b	Take rest and drink fluids	f	active	2026-04-28 16:16:19.867623
120f6a9f-1fb9-4ebd-867a-7d04ec3c6048	0c89c255-e803-4401-8571-9522256de704	ac64cee1-c3cb-4ec0-a2fc-beafee9bac8d	Child's pose and knee-to-chest stretches are a great, gentle place to start!	f	active	2026-04-28 17:49:08.126871
faf92dc9-ed85-42c7-9b28-a483ce525fbb	5665befd-a453-488f-af2a-0bc47529d948	a2371b3a-284b-4f63-9255-cbeac57208d6	hello	f	active	2026-05-14 23:17:46.473918
77cb0103-3808-4a78-a6cd-074b8b7d3687	ada224ba-af3c-4430-b632-747deb81ebfa	8713248d-073f-4ec7-949f-83ce0d2affb3	Hi	f	active	2026-05-17 16:54:13.920948
c0e57aa8-6e8b-4210-8bf7-33723f48b3be	958cd013-bcab-494a-beb0-bf61bfa0f6f9	8713248d-073f-4ec7-949f-83ce0d2affb3	apne repo ka kya naam rakha he?	f	active	2026-05-17 16:54:53.017231
e06eab05-bfc5-4e1c-9778-ccba4da68020	958cd013-bcab-494a-beb0-bf61bfa0f6f9	8713248d-073f-4ec7-949f-83ce0d2affb3	professionalism naam ki cheez hi nahi he	f	active	2026-05-17 16:55:31.429554
\.


--
-- TOC entry 5331 (class 0 OID 17306)
-- Dependencies: 235
-- Data for Name: forum_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.forum_reports (report_id, post_id, reported_by, reason, description, status, created_at, resolution, resolved_at) FROM stdin;
833421da-5156-4ef3-938e-62bfc2efc499	5665befd-a453-488f-af2a-0bc47529d948	a2371b3a-284b-4f63-9255-cbeac57208d6	abuse	Gali de raha he	active	2026-05-14 23:19:17.296016	\N	\N
\.


--
-- TOC entry 5326 (class 0 OID 17191)
-- Dependencies: 230
-- Data for Name: medical_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.medical_history (history_id, patient_user_id, event_type, title, description, related_prescription_id, related_appointment_id, event_date, added_by, created_at) FROM stdin;
06394780-23fd-4e38-8949-c130eb18703b	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	disease	Flu Record	Patient had seasonal flu	\N	\N	2026-04-18	\N	2026-04-28 16:16:19.867623
c42f0ce6-19d6-421e-bb8e-fc5b1da33a60	194d097e-b430-4d5f-ae54-ca6ea35dd857	disease	Flu Record	Patient had seasonal flu	\N	\N	2026-04-18	\N	2026-04-28 16:16:19.867623
1fc85f13-91d7-4ade-b4ed-c49f088aedc4	09f99c55-20e8-4e86-a7ba-01f655e26a6a	disease	Flu Record	Patient had seasonal flu	\N	\N	2026-04-18	\N	2026-04-28 16:16:19.867623
933a84f6-4a05-4536-a751-9693761c02ed	87a8d557-d37a-4ade-bc34-978ef2c4a322	disease	Flu Record	Patient had seasonal flu	\N	\N	2026-04-18	\N	2026-04-28 16:16:19.867623
c6db5341-d935-4408-b81b-35430fcf045e	0cfb955b-5284-4ed0-bbcc-2f29085cf65e	disease	Flu Record	Patient had seasonal flu	\N	\N	2026-04-18	\N	2026-04-28 16:16:19.867623
448b08c9-e99a-4902-af36-fb2fbad3fb57	20a16369-e2ab-403e-a650-e1bd3fd0090a	disease	Flu Record	Patient had seasonal flu	\N	\N	2026-04-18	\N	2026-04-28 16:16:19.867623
7ae33031-1c49-49ef-8485-a662c4192486	2a5a1644-9799-4f9f-8d7d-3efe49e07dbc	disease	Flu Record	Patient had seasonal flu	\N	\N	2026-04-18	\N	2026-04-28 16:16:19.867623
597af6fa-5a61-4f52-ac46-0b9c69998980	908990f4-84a5-4e87-879c-294bc339b9a9	disease	Flu Record	Patient had seasonal flu	\N	\N	2026-04-18	\N	2026-04-28 16:16:19.867623
ac673b24-5490-4c21-9052-52f766ce7272	70edd123-38bc-4816-a27d-988d33612e6f	disease	Flu Record	Patient had seasonal flu	\N	\N	2026-04-18	\N	2026-04-28 16:16:19.867623
d6f86ffb-957a-49b5-a60c-581794537078	def4be95-88f1-4bfe-819e-5443b6cec18d	disease	Flu Record	Patient had seasonal flu	\N	\N	2026-04-18	\N	2026-04-28 16:16:19.867623
e95cf859-9b31-4b47-bf9e-48fab6bf0f42	046468d7-29c0-4232-bab7-57f82be30862	disease	Flu Record	Patient had seasonal flu	\N	\N	2026-04-18	\N	2026-04-28 16:16:19.867623
5bb559e9-7580-4cc9-97b1-8cd578e74994	ac64cee1-c3cb-4ec0-a2fc-beafee9bac8d	disease	Flu Record	Patient had seasonal flu	\N	\N	2026-04-18	\N	2026-04-28 16:16:19.867623
8f1aae92-ab9b-4f35-bed4-dd19114cb113	42b4b367-4809-4139-9a93-464a09ab1c4f	disease	Flu Record	Patient had seasonal flu	\N	\N	2026-04-18	\N	2026-04-28 16:16:19.867623
733882ec-3e10-46c2-8a27-c293c1659917	c2eeabe0-8eb7-409b-b516-14d5c9baf425	Appointment Booked	Appointment scheduled for: ZXCVBNM	\N	\N	c4cdd847-5ccb-4c54-82eb-cf39eb1f654a	2026-05-07	c2eeabe0-8eb7-409b-b516-14d5c9baf425	2026-05-07 17:07:58.382703
d49cfb65-9e07-4941-9b45-48387cc79b7d	e5acd622-2706-4a0d-8583-1870a1e82861	Vitals Logged	Patient submitted routine vitals	\N	\N	\N	2026-05-10	e5acd622-2706-4a0d-8583-1870a1e82861	2026-05-10 14:51:16.2634
fa56a68a-c6d2-46d1-bbe2-0ac94eff31f5	e5acd622-2706-4a0d-8583-1870a1e82861	System Alert	⚠️ HIGH ALERT: Hypertensive Crisis	Systolic Blood Pressure spiked to 500.	\N	\N	2026-05-10	\N	2026-05-10 14:51:16.282154
211cee3b-5fcd-4777-a288-0d36def4721c	e5acd622-2706-4a0d-8583-1870a1e82861	Appointment Booked	Appointment scheduled for: Hello	\N	\N	e5ceb070-447c-4d45-8375-d451e9189f60	2026-05-10	e5acd622-2706-4a0d-8583-1870a1e82861	2026-05-10 14:52:54.816297
a68388d1-6b7b-492d-9011-dc6118071f91	e5acd622-2706-4a0d-8583-1870a1e82861	Appointment Updated	Appointment status changed to: confirmed	\N	\N	e5ceb070-447c-4d45-8375-d451e9189f60	2026-05-10	\N	2026-05-10 14:53:29.693505
a08f7cc7-c729-4356-a9ed-6a16c29711c0	e5acd622-2706-4a0d-8583-1870a1e82861	Appointment Updated	Appointment status changed to: confirmed	\N	\N	e5ceb070-447c-4d45-8375-d451e9189f60	2026-05-10	\N	2026-05-10 14:53:35.401006
179da6ae-689b-479f-bef7-8fb2c3659a62	e5acd622-2706-4a0d-8583-1870a1e82861	Appointment Updated	Appointment status changed to: completed	\N	\N	e5ceb070-447c-4d45-8375-d451e9189f60	2026-05-10	\N	2026-05-10 14:53:38.567593
abf98849-5a78-42ca-9129-2b039f4e4d03	e5acd622-2706-4a0d-8583-1870a1e82861	Appointment Updated	Appointment status changed to: confirmed	\N	\N	e5ceb070-447c-4d45-8375-d451e9189f60	2026-05-10	\N	2026-05-10 14:54:04.668025
d83bb59f-c01b-4570-86a3-1415993fb99d	e5acd622-2706-4a0d-8583-1870a1e82861	Appointment Updated	Appointment status changed to: confirmed	\N	\N	e5ceb070-447c-4d45-8375-d451e9189f60	2026-05-10	\N	2026-05-10 14:54:06.287248
ed62e8f7-76d7-46c1-8559-73e0aeee6919	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Appointment Booked	Appointment scheduled for: Sugar	\N	\N	12f3084a-1259-4d40-a1d3-72860ef84173	2026-05-14	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-14 23:59:15.021554
a7182c59-0e8c-45ec-ab09-f62caa79aa7c	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Appointment Updated	Appointment status changed to: confirmed	\N	\N	12f3084a-1259-4d40-a1d3-72860ef84173	2026-05-14	\N	2026-05-14 23:59:43.937827
f7bbf3ea-4cb6-4aae-87be-e662245a2285	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Appointment Updated	Appointment status changed to: confirmed	\N	\N	12f3084a-1259-4d40-a1d3-72860ef84173	2026-05-15	\N	2026-05-15 00:00:30.225578
d61e6553-396a-4513-b7ef-432e2994d744	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Appointment Updated	Appointment status changed to: confirmed	\N	\N	12f3084a-1259-4d40-a1d3-72860ef84173	2026-05-15	\N	2026-05-15 00:00:32.586228
a64d90ab-ec31-4994-81c8-6a75b7c06c17	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Appointment Updated	Appointment status changed to: completed	\N	\N	12f3084a-1259-4d40-a1d3-72860ef84173	2026-05-15	\N	2026-05-15 00:00:33.681304
fd42682f-fd9f-4603-b332-7b51cb84334e	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Appointment Updated	Appointment status changed to: confirmed	\N	\N	12f3084a-1259-4d40-a1d3-72860ef84173	2026-05-15	\N	2026-05-15 00:00:34.925543
c8bc7265-c36e-4c91-a33a-1498354cf72e	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Appointment Updated	Appointment status changed to: completed	\N	\N	12f3084a-1259-4d40-a1d3-72860ef84173	2026-05-15	\N	2026-05-15 00:00:36.741529
3f4593b3-7a1d-41ec-a235-b9aa37541f10	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Appointment Updated	Appointment status changed to: confirmed	\N	\N	12f3084a-1259-4d40-a1d3-72860ef84173	2026-05-15	\N	2026-05-15 00:02:15.346194
780963cd-06dd-4ba0-8ab2-ad2708bdbf9e	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Vitals Logged	Patient submitted routine vitals	\N	\N	\N	2026-05-15	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-15 00:17:07.302551
d4a8069f-3777-4544-864a-bbbc1603a74d	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	System Alert	⚠️ HIGH ALERT: Severe Hyperglycemia	Blood glucose logged at 500 mg/dL (very high).	\N	\N	2026-05-15	\N	2026-05-15 00:17:07.307856
168e7d62-1543-4296-9fdf-1c4fedc0ea82	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Prescription Added	Doctor prescribed treatment for: Diabetes 	\N	23f9b767-1161-4b3b-bc1b-77bb01d10749	\N	2026-05-15	4a790890-5573-463a-aaf2-a2d32eefd04a	2026-05-15 00:36:19.605848
a66b2282-82d5-4ac7-8e04-08d7cd6a90dd	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Appointment Booked	Appointment scheduled for: dsadsa	\N	\N	bcabfce9-ff76-4d00-b965-0f9a2a486787	2026-05-14	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-15 01:23:36.373737
76e1c421-9740-4db1-820f-c0f903c68114	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Appointment Booked	Appointment scheduled for: follow up	\N	\N	067d54e3-672f-4874-86eb-2c605726fdd8	2026-05-14	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-15 01:38:36.963525
ba90b1c8-b36c-4886-8239-57732afbd723	c2987363-8e64-4dc2-84fd-1260b0b3bad6	Appointment Booked	Appointment scheduled for 17-May-2026, 9:00 am	Headache	\N	079e227a-c015-443c-b3fc-66dbac0642ec	2026-05-17	c2987363-8e64-4dc2-84fd-1260b0b3bad6	2026-05-16 13:10:42.30202
75107667-ba66-4f29-b034-927ba3d2ad34	c2987363-8e64-4dc2-84fd-1260b0b3bad6	Appointment Updated	Appointment status changed to: confirmed	\N	\N	079e227a-c015-443c-b3fc-66dbac0642ec	2026-05-17	\N	2026-05-16 13:15:01.45154
68d7fd06-3d14-4b7e-8b64-349cb03d52f5	c2987363-8e64-4dc2-84fd-1260b0b3bad6	Appointment Updated	Appointment status changed to: completed	\N	\N	079e227a-c015-443c-b3fc-66dbac0642ec	2026-05-17	\N	2026-05-16 13:18:13.154856
65918d51-2adc-4e27-8c6b-f44eca268e40	c2987363-8e64-4dc2-84fd-1260b0b3bad6	Appointment Booked	Appointment scheduled for 20-May-2026, 9:00 am	Nausea	\N	f68c8d87-3466-4c98-8e04-2bf07d64ce76	2026-05-20	c2987363-8e64-4dc2-84fd-1260b0b3bad6	2026-05-16 13:19:21.132207
051e4e35-3f29-4a1c-be8b-5f2128b33154	c2987363-8e64-4dc2-84fd-1260b0b3bad6	Appointment Updated	Appointment status changed to: confirmed	\N	\N	f68c8d87-3466-4c98-8e04-2bf07d64ce76	2026-05-20	\N	2026-05-16 13:20:20.855101
54588069-4adc-4265-84af-f633f5abdcd4	c2987363-8e64-4dc2-84fd-1260b0b3bad6	Appointment Booked	Appointment scheduled for 21-May-2026, 9:00 am	Issue	\N	f33af776-2ccd-4db3-a8ce-4a9ff1c62f64	2026-05-21	c2987363-8e64-4dc2-84fd-1260b0b3bad6	2026-05-16 13:29:12.323201
b735a161-d2d0-4491-a132-0b5a501857af	c2987363-8e64-4dc2-84fd-1260b0b3bad6	Appointment Updated	Appointment status changed to: confirmed	\N	\N	f33af776-2ccd-4db3-a8ce-4a9ff1c62f64	2026-05-21	\N	2026-05-16 13:30:02.935956
739bfb74-f93b-4f7b-8311-b2c42641b86d	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Appointment Booked	Appointment scheduled for 22-May-2026, 9:00 am	Testing	\N	7e32b81d-033e-4fd7-874c-484e6204febf	2026-05-22	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 09:57:19.06001
7a2665e3-a0a4-45c4-a360-402d9c5cd261	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Appointment Updated	Appointment status changed to: confirmed	\N	\N	7e32b81d-033e-4fd7-874c-484e6204febf	2026-05-22	\N	2026-05-17 09:58:16.209482
86f1e670-cf4f-410f-aca1-9278b647116d	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Prescription Added	Doctor prescribed treatment for: Fever	\N	8f43ca99-1c20-40b5-a9cd-7da7f2144fc7	\N	2026-05-17	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-17 10:08:12.781523
4921cbb8-3439-4273-a946-2f7d9256956b	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Prescription Added	Doctor prescribed treatment for: Heart	\N	a037c82d-7bde-4e81-ac8c-e909a4d71c10	\N	2026-05-17	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-17 10:18:27.179689
0a292ebf-e5b8-441e-baa9-6c7f8d11999e	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Appointment Updated	Appointment status changed to: rejected	\N	\N	12f3084a-1259-4d40-a1d3-72860ef84173	2026-06-13	\N	2026-05-17 12:00:25.112677
cb5852c7-6f39-4562-8edb-bcf599ba03c8	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Appointment Updated	Appointment status changed to: rejected	\N	\N	7e32b81d-033e-4fd7-874c-484e6204febf	2026-05-22	\N	2026-05-17 12:00:31.32859
c02781ab-e72f-44c4-a485-9c8999c182b2	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Appointment Booked	Appointment scheduled for 22-May-2026, 9:00 am	Testing	\N	cd1f0c9e-eb75-4055-b84c-d920dbacfa62	2026-05-22	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 12:00:44.976786
11fc21dd-5f59-4520-bc02-706cd5cbd82b	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Appointment Updated	Appointment status changed to: confirmed	\N	\N	cd1f0c9e-eb75-4055-b84c-d920dbacfa62	2026-05-22	\N	2026-05-17 12:01:11.115419
da94b5ef-4bbb-4d3d-9c44-064b42c0b497	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Prescription Added	Doctor prescribed treatment for: Testing	\N	b430788e-2e86-4b0f-9a21-d4d0a90cdd21	\N	2026-05-17	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-17 12:01:30.340194
a6704359-1cf9-4c76-8e99-2cb473813f20	c2987363-8e64-4dc2-84fd-1260b0b3bad6	Appointment Updated	Appointment status changed to: completed	\N	\N	f68c8d87-3466-4c98-8e04-2bf07d64ce76	2026-05-20	\N	2026-05-17 12:15:56.352944
7c271ce5-25b3-46d6-88cb-723938e2149d	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Appointment Updated	Appointment status changed to: rejected	\N	\N	bcabfce9-ff76-4d00-b965-0f9a2a486787	2026-05-14	\N	2026-05-17 13:37:10.89208
a912a274-98e9-4a32-b94f-8ceaabc6144a	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Appointment Updated	Appointment status changed to: rejected	\N	\N	067d54e3-672f-4874-86eb-2c605726fdd8	2026-05-14	\N	2026-05-17 13:37:57.930703
769ac0b0-3e37-4038-9be7-e825c4493d09	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Appointment Booked	Appointment scheduled for 23-May-2026, 9:00 am	Testing	\N	f0458ea3-64ed-4d4d-9798-bd14fe328563	2026-05-23	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 17:48:22.359591
0128060b-f8b8-4d93-abd7-b82ac49977df	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Appointment Updated	Appointment status changed to: confirmed	\N	\N	f0458ea3-64ed-4d4d-9798-bd14fe328563	2026-05-23	\N	2026-05-17 18:03:39.946679
b5212bbc-62dc-4450-bbf9-7bc820ff0865	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Vitals Logged	Patient submitted routine vitals	\N	\N	\N	2026-05-17	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 18:09:09.131846
6f3c9802-3f48-4db8-8f60-eaf414c9d18a	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	System Alert	⚠️ HIGH ALERT: Hypertensive Crisis	Systolic Blood Pressure spiked to 500.	\N	\N	2026-05-17	\N	2026-05-17 18:09:09.145022
fcb25b39-b4e2-4085-a075-ac17179ad28b	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Vitals Logged	Patient submitted routine vitals	\N	\N	\N	2026-05-17	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 18:11:12.006546
f43e2e7d-39a3-4a80-b5c2-69c96e30916f	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	System Alert	⚠️ HIGH ALERT: Severe Hyperglycemia	Blood glucose logged at 4999 mg/dL (very high).	\N	\N	2026-05-17	\N	2026-05-17 18:11:12.01429
584724e3-cafd-4e4b-9b3a-f5e4ff583582	c2987363-8e64-4dc2-84fd-1260b0b3bad6	Vitals Logged	Patient submitted routine vitals	\N	\N	\N	2026-05-17	c2987363-8e64-4dc2-84fd-1260b0b3bad6	2026-05-17 19:10:32.702635
d50c6150-04b3-4abb-8475-ce934ea2370b	c2987363-8e64-4dc2-84fd-1260b0b3bad6	System Alert	⚠️ HIGH ALERT: Hypertensive Crisis	Systolic Blood Pressure spiked to 500.	\N	\N	2026-05-17	\N	2026-05-17 19:10:32.716592
c6661dc9-42e5-4b3f-a7c9-eaeab3dc03c5	c2987363-8e64-4dc2-84fd-1260b0b3bad6	Appointment Updated	Appointment status changed to: completed	\N	\N	f33af776-2ccd-4db3-a8ce-4a9ff1c62f64	2026-05-21	\N	2026-05-17 22:50:09.369692
c376a9bc-9153-4c9a-a770-921f917bb1e8	c2987363-8e64-4dc2-84fd-1260b0b3bad6	Appointment Booked	Appointment scheduled for 19-May-2026, 9:00 am	Consultation (Neurology)	\N	003b6f0d-6a38-4748-9bb6-20b2174755ec	2026-05-19	c2987363-8e64-4dc2-84fd-1260b0b3bad6	2026-05-18 16:37:38.804921
0306b363-5206-4cdd-bff1-45afe001c6fa	c2987363-8e64-4dc2-84fd-1260b0b3bad6	Appointment Updated	Appointment status changed to: confirmed	\N	\N	003b6f0d-6a38-4748-9bb6-20b2174755ec	2026-05-19	\N	2026-05-18 16:38:05.313984
ca0996b7-08f0-4314-944d-f17b59166120	997621a6-b110-4f5e-bb09-573223cbcf39	Appointment Booked	Appointment scheduled for 24-May-2026, 9:00 am	Test	\N	aa647fb0-fdb9-498b-a85b-029b9c1517c2	2026-05-24	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-18 16:57:04.167355
54476b9b-d774-4ce5-b971-fe34bd97a433	997621a6-b110-4f5e-bb09-573223cbcf39	Appointment Updated	Appointment status changed to: confirmed	\N	\N	aa647fb0-fdb9-498b-a85b-029b9c1517c2	2026-05-24	\N	2026-05-18 16:57:23.631629
3256a358-dd0b-4c03-ac47-7cfcaf17990d	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Appointment Updated	Appointment status changed to: completed	\N	\N	cd1f0c9e-eb75-4055-b84c-d920dbacfa62	2026-05-22	\N	2026-05-18 17:10:00.736483
857f0c8f-5288-439d-84a3-7b851d2fdc4e	997621a6-b110-4f5e-bb09-573223cbcf39	Prescription Added	Doctor prescribed treatment for: Sugar	\N	fd311590-b970-4258-91bb-920fb36211b5	\N	2026-05-18	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-18 22:53:51.297642
9e70b44c-fb06-4a2d-ba26-fc6440490653	997621a6-b110-4f5e-bb09-573223cbcf39	Appointment Updated	Appointment status changed to: completed	\N	\N	aa647fb0-fdb9-498b-a85b-029b9c1517c2	2026-05-24	\N	2026-05-18 22:54:55.523705
848f2640-ce07-4b89-92b6-2fc8ed6f70bd	997621a6-b110-4f5e-bb09-573223cbcf39	Prescription Added	Doctor prescribed treatment for: Diabetes	\N	c44bf76f-b6fa-48a0-aa36-d48a5eefa33a	\N	2026-05-18	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-18 22:55:37.088753
6da3b7c7-c5d0-49ce-9c70-4bb7f492c9be	997621a6-b110-4f5e-bb09-573223cbcf39	Appointment Booked	Appointment scheduled for 23-May-2026, 9:00 am	Hello	\N	19efbc18-2d73-48b4-866f-0547fcaf4892	2026-05-23	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-18 22:59:22.267099
f2f43f5d-ee2c-46bf-bbc1-878f415414f8	997621a6-b110-4f5e-bb09-573223cbcf39	Appointment Updated	Appointment status changed to: confirmed	\N	\N	19efbc18-2d73-48b4-866f-0547fcaf4892	2026-05-23	\N	2026-05-18 22:59:56.985407
3464d349-b5fb-40f2-bada-eea4d4b2feae	997621a6-b110-4f5e-bb09-573223cbcf39	Prescription Added	Doctor prescribed treatment for: isfa	\N	7aaea53b-6e59-4a78-8cce-d3aa23882c71	\N	2026-05-18	1375627f-98f3-47d0-9e68-3e92b69cf5f3	2026-05-18 23:00:30.024099
511781e6-6a03-4b69-9eb1-7f771fd075f2	997621a6-b110-4f5e-bb09-573223cbcf39	Appointment Updated	Appointment status changed to: completed	\N	\N	19efbc18-2d73-48b4-866f-0547fcaf4892	2026-05-23	\N	2026-05-18 23:13:37.110406
b559710f-17f1-4427-b23a-e54eaf465276	997621a6-b110-4f5e-bb09-573223cbcf39	Appointment Booked	Appointment scheduled for 19-May-2026, 12:00 am	Hi	\N	5ffbabe1-5950-4097-a027-b2cc4f2e09c2	2026-05-18	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-18 23:45:22.428749
97868bf1-53d8-4c46-9f6d-c8a5aab79f55	997621a6-b110-4f5e-bb09-573223cbcf39	Appointment Updated	Appointment status changed to: confirmed	\N	\N	5ffbabe1-5950-4097-a027-b2cc4f2e09c2	2026-05-18	\N	2026-05-18 23:45:50.75078
442b6ca0-b827-47e1-92b6-d8bf4bd0dfb2	997621a6-b110-4f5e-bb09-573223cbcf39	Appointment Updated	Appointment status changed to: completed	\N	\N	5ffbabe1-5950-4097-a027-b2cc4f2e09c2	2026-05-18	\N	2026-05-19 00:05:26.420024
8ef97a4e-fc0d-4bbf-bd9f-b11ec2fa34a3	997621a6-b110-4f5e-bb09-573223cbcf39	Appointment Booked	Appointment scheduled for 19-May-2026, 12:30 am	Bye	\N	3d8a6cf6-3f50-49fa-ad8e-faa917de56ae	2026-05-18	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-19 00:15:12.422688
8908dadf-ad2a-4879-af75-abe78b759772	997621a6-b110-4f5e-bb09-573223cbcf39	Appointment Updated	Appointment status changed to: confirmed	\N	\N	3d8a6cf6-3f50-49fa-ad8e-faa917de56ae	2026-05-18	\N	2026-05-19 00:15:32.303012
\.


--
-- TOC entry 5341 (class 0 OID 17598)
-- Dependencies: 245
-- Data for Name: medical_specializations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.medical_specializations (specialization_id, name, description, is_active, created_at, updated_at) FROM stdin;
1	Allergy and Immunology	Immune system conditions, allergies, and asthma.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
2	Anesthesiology	Anesthesia, perioperative care, and pain control.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
3	Audiology	Hearing, balance, and related ear conditions.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
4	Bariatric Medicine	Medical care for obesity and weight management.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
5	Cardiology	Heart and vascular system health.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
6	Cardiothoracic Surgery	Surgery for heart, lungs, and chest organs.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
7	Critical Care Medicine	Care for life-threatening illness and ICU patients.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
8	Dentistry	Teeth, gums, and oral health care.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
9	Dermatology	Skin, hair, and nail conditions.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
10	Endocrinology	Hormones, diabetes, thyroid, and metabolic conditions.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
11	ENT	Ear, nose, throat, sinus, and voice conditions.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
12	Family Medicine	Whole-family primary care across all ages.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
13	Gastroenterology	Digestive tract, liver, and pancreas care.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
14	General Medicine	Primary adult medical care and common illnesses.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
15	General Surgery	Surgical care for common abdominal and soft tissue problems.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
16	Geriatrics	Medical care focused on older adults.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
17	Gynecology	Women's reproductive and pelvic health.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
18	Hematology	Blood disorders and clotting conditions.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
19	Hepatology	Liver, gallbladder, and bile duct conditions.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
20	Infectious Disease	Complex infections and antimicrobial care.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
21	Internal Medicine	Adult diagnosis, treatment, and preventive care.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
22	Neonatology	Medical care for newborns and premature infants.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
23	Nephrology	Kidney disease, dialysis, and blood pressure care.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
24	Neurology	Brain, spine, nerve, and nervous system disorders.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
25	Neurosurgery	Surgery for brain, spine, and nerve disorders.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
26	Nutrition and Dietetics	Diet planning, clinical nutrition, and wellness.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
27	Obstetrics	Pregnancy, childbirth, and postpartum care.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
28	Obstetrics and Gynecology	Pregnancy and women's reproductive health.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
29	Oncology	Cancer diagnosis, treatment, and follow-up care.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
30	Ophthalmology	Eye disease, vision care, and eye surgery.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
31	Orthopedics	Bones, joints, ligaments, and musculoskeletal care.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
32	Pain Medicine	Diagnosis and treatment of acute and chronic pain.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
33	Pathology	Laboratory diagnosis of disease.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
34	Pediatrics	Medical care for infants, children, and adolescents.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
35	Physical Medicine and Rehabilitation	Recovery, mobility, and functional rehabilitation.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
36	Plastic Surgery	Reconstructive and cosmetic surgical care.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
37	Psychiatry	Mental health, behavior, and medication management.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
38	Psychology	Therapy, testing, and behavioral health support.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
39	Pulmonology	Lung and breathing conditions.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
40	Radiology	Medical imaging and image-guided diagnosis.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
41	Rheumatology	Autoimmune, joint, and connective tissue disorders.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
42	Sleep Medicine	Sleep disorders, insomnia, and sleep apnea.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
43	Sports Medicine	Exercise injuries, performance, and musculoskeletal health.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
44	Urology	Urinary tract and male reproductive health.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
45	Vascular Surgery	Surgery for arteries, veins, and circulation problems.	t	2026-05-17 17:11:24.296928	2026-05-17 18:39:26.702992
\.


--
-- TOC entry 5323 (class 0 OID 17133)
-- Dependencies: 227
-- Data for Name: medication_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.medication_logs (log_id, patient_medication_id, patient_user_id, scheduled_time, taken_at, status, dose_period, dose_dosage, missed_alert_sent) FROM stdin;
faaafe51-3ff7-4002-a135-b8a0bdba58cd	540dc9d2-143c-45b7-b6f9-517b7d91ce8c	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	taken	\N	\N	f
2537b0f2-dbea-42bd-aed0-32f1513a6724	d5bb9e1a-eb52-450d-a384-1eacb598b33f	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	taken	\N	\N	f
bb9d2e24-3a95-4de3-8751-c2b887c99313	c00ee85f-e45d-4bdf-8e43-e9dd63b2feb2	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	taken	\N	\N	f
655ff91e-06a1-4d8d-8a26-ddba1e980b26	5c49c2e0-f6be-4298-adbd-947d8744c3c0	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	taken	\N	\N	f
d23959ce-119f-43c5-9c88-87f8169a65fa	43836e21-982f-4675-b0a3-5fe5b5d370eb	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	taken	\N	\N	f
e20e1b42-975d-44c1-900b-84b51d82af7c	caa09d3e-d926-4694-8c31-91ca9432c7d7	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	taken	\N	\N	f
859fc387-4b99-4c84-81b1-2ea566458076	fef3d70c-febe-48e8-8eaf-82a4fd078ef2	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	taken	\N	\N	f
91b9ab7f-080e-4d30-8cb6-b79a7db6f4a5	4137777a-b0ca-439f-a23a-879592594dc4	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	taken	\N	\N	f
fed3be40-2d44-47ba-84d0-b0adbf785b5a	61e96171-e1d5-4894-9d2f-8f4bf94aa4f1	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	taken	\N	\N	f
52709509-3f81-4380-8e7e-3d266636ce83	2939ed97-576e-45c2-9ebc-29c02c5fc2b2	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	taken	\N	\N	f
541059cb-8011-4e5d-8884-3b12eb30500a	94ada8fb-00b7-48e7-8685-b297e6c6e0da	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	taken	\N	\N	f
cc16b0cf-e1fa-475a-a1fe-433c8ce998ef	77fd81f7-be3a-4431-9dee-8e6243d8db46	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	taken	\N	\N	f
f7eaf9a2-c7ae-4fa4-827d-3ba9a4c9bea3	f21ed05d-3593-4750-b0ec-f150f1468b92	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	taken	\N	\N	f
d856302e-5cf1-416b-aebe-b8f15a92e6fa	7213c8a9-9531-4c1e-8a4d-397a3feaf31d	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	taken	\N	\N	f
226aa4fb-7868-438c-b5aa-279408d1dc47	bcc1bdf8-60f1-414c-848d-a489a07846f1	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	taken	\N	\N	f
4e0b8d3a-b917-4009-afc3-5078bc9ccf4a	30edfcd4-95cd-4a4d-af87-7a3723c00d5d	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	taken	\N	\N	f
8ea13c39-ce1f-4fc4-b1e1-b08fd5f15ce5	baed39f8-df0d-4f8c-a44e-ca603986f423	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	taken	\N	\N	f
4763d28c-3e3b-46b5-b718-4e12eec8e7db	2bc596a8-b827-4956-9f78-56fa302bf171	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	taken	\N	\N	f
8cfffc61-f5a3-49fa-83ae-45d6ed2e241f	4bf1c878-0496-4e02-b818-b30628d44735	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	taken	\N	\N	f
30252985-e86e-4933-ba13-6463d6be4f47	94e0eadc-4fb3-493e-9c3f-ec82027054c0	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	2026-04-28 16:16:19.867623	2026-04-28 16:16:19.867623	taken	\N	\N	f
3204321e-3f5e-4601-a8fc-2f31c2352d15	681df7c9-56b6-4815-9253-125b47f2f5cb	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-30 20:00:00	2026-05-17 23:05:57.963	taken	evening	1	f
9cb05e7c-16af-4231-ad6b-18bcb38c1f5e	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 20:00:00	2026-05-17 18:45:09.636	taken	evening	2	f
d1e358ec-aec0-484c-9ff4-1afbdcd29bd9	\N	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	131231-03-12 02:11:00	2026-05-15 00:19:29.664	taken	\N	\N	f
3b499f39-2aed-4c21-b1c7-a640f77c6724	0de35e38-c9e1-460c-b6fa-44efd6df7be9	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	\N	2026-05-15 01:24:56.498	taken	\N	\N	f
bb3c1266-0130-40ca-966c-5033481f5dfa	0ede12c1-1106-4260-8562-22666337909b	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-29 05:00:00	2026-05-17 12:02:19.783	taken	\N	\N	f
61eee0b7-4189-4709-97b6-5294c77a770e	0ede12c1-1106-4260-8562-22666337909b	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-29 00:00:00	2026-05-17 12:02:22.613	taken	\N	\N	f
e916f3e0-f3c7-44a4-afbd-39e9f7c0d3af	236a4e54-a1b8-4e27-aaab-fdd18e05ce3b	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-26 05:00:00	2026-05-17 12:54:01.747	taken	\N	\N	f
eafc7ff5-6be3-4484-a2f3-ec76425c5162	df9ea489-7822-4161-8fdf-e388eeae1463	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 13:15:31.552	2026-05-17 13:16:15.392	taken	\N	\N	f
e804f12a-8b8a-4cee-9649-e0853aa9f586	2a29e6a6-a336-4645-bd21-c222ff2ace2e	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 15:53:39.91	2026-05-17 18:11:46.569	taken	\N	\N	f
b91ed7c9-40be-4352-bf96-d03cdd1794f4	236a4e54-a1b8-4e27-aaab-fdd18e05ce3b	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-26 00:00:00	2026-05-17 18:11:49.121	taken	\N	\N	f
8431c1d9-6074-47d1-9169-f91a614a921a	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-29 09:00:00	\N	pending	morning	2	f
1d78f538-9ef7-4ad0-95f5-66f61c18c1f9	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-29 20:00:00	\N	pending	evening	2	f
0939df80-a18f-441e-a281-6a1a6f28cc9a	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-30 09:00:00	\N	pending	morning	2	f
14810572-50fb-4c63-9ded-c69349b635d8	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-30 20:00:00	\N	pending	evening	2	f
28673e12-3b3a-4fd9-801a-b4596a90b742	681df7c9-56b6-4815-9253-125b47f2f5cb	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-29 09:00:00	\N	pending	morning	4	f
5cf58af5-10d0-4112-b4e6-21a6fa8f3b2a	681df7c9-56b6-4815-9253-125b47f2f5cb	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-29 20:00:00	\N	pending	evening	1	f
278e5e5c-348f-4ce3-8562-accdb7028768	681df7c9-56b6-4815-9253-125b47f2f5cb	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-30 09:00:00	\N	pending	morning	4	f
bf9724a5-2d72-4b7c-a759-24c1a4f10102	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-17 09:00:00	2026-05-17 22:53:56.738	taken	morning	2	t
4a700617-4be8-4b32-944f-215b698a353d	681df7c9-56b6-4815-9253-125b47f2f5cb	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-26 09:00:00	2026-05-17 23:05:33.546	taken	morning	4	f
80c84e3a-1947-48f6-8d94-837b49c2dc6f	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-18 09:00:00	\N	missed	morning	2	t
842cada4-842b-45ff-b8e7-108c76d04e6d	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-19 09:00:00	\N	pending	morning	1	f
3fe09b3e-a7c1-4bf0-b9c5-3f2b44c961ee	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-19 14:00:00	\N	pending	afternoon	1	f
bf4c1296-ba92-4378-b8f1-3b3e6806d0ed	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-19 20:00:00	\N	pending	evening	1	f
a50b4912-65cf-489b-b0ac-ae7a8d38dc70	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-20 09:00:00	\N	pending	morning	1	f
7632afa6-547f-425e-95a6-1be97f4e1a0f	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-20 14:00:00	\N	pending	afternoon	1	f
41dabb69-8bf3-4e0d-9daa-4bb026910646	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-20 20:00:00	\N	pending	evening	1	f
b9a9548e-de8e-4bf8-a4a3-97711428943f	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-21 09:00:00	\N	pending	morning	1	f
78777b2c-564c-4c33-b54d-688509e51625	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-21 14:00:00	\N	pending	afternoon	1	f
6afc3e18-4415-4340-a10a-4adb598eb465	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-18 20:00:00	\N	missed	evening	2	t
0520825c-c8f4-48ae-955d-14ac80dc8cce	681df7c9-56b6-4815-9253-125b47f2f5cb	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-25 09:00:00	\N	missed	morning	4	t
b86069dc-38f6-4b57-9525-b492f092cede	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-21 20:00:00	\N	pending	evening	1	f
05ef63c0-38e6-4285-871e-cfe2fae6a9c4	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-22 09:00:00	\N	pending	morning	1	f
2989ccd2-4deb-4e19-abd7-54d34ebb6810	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-22 14:00:00	\N	pending	afternoon	1	f
0c0493c4-a677-46fc-a160-f66ede92fae6	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-22 20:00:00	\N	pending	evening	1	f
90b42868-9ecd-4c06-a532-d32ff4fd61b6	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-23 09:00:00	\N	pending	morning	1	f
42e9a2e4-66e5-41bd-9808-76cf5c9aea7e	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-23 14:00:00	\N	pending	afternoon	1	f
cb9e5a4d-6576-436e-abdd-68f46346f01e	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-23 20:00:00	\N	pending	evening	1	f
793b584c-06e4-438a-b6ae-2a724cea5b52	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-24 09:00:00	\N	pending	morning	1	f
0ac3664e-2d30-4828-94b9-bb1121afce66	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-24 14:00:00	\N	pending	afternoon	1	f
69b3266c-157e-45e3-a733-1c80fade199a	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-24 20:00:00	\N	pending	evening	1	f
05e7ee08-939d-4875-bf05-6334b35fc3ab	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-25 09:00:00	\N	pending	morning	1	f
b4dc189b-86da-4494-8503-cad0df36243e	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-25 14:00:00	\N	pending	afternoon	1	f
dcb220f9-05be-4498-9263-e04ce52615e1	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-25 20:00:00	\N	pending	evening	1	f
0bf6b146-90f8-4a93-9d78-0175be6d4709	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-26 09:00:00	\N	pending	morning	1	f
b86cdcfe-d2af-4dd9-a76c-be0f8aa5f004	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-26 14:00:00	\N	pending	afternoon	1	f
95694197-2ed7-45dc-b43d-f71c9bb8be8d	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-26 20:00:00	\N	pending	evening	1	f
bff4191e-d1a9-48f0-a7c7-e9127f44b7e3	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-27 09:00:00	\N	pending	morning	1	f
bfea8456-8a2d-4e47-99d7-5895c9ebde57	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-27 14:00:00	\N	pending	afternoon	1	f
10fd4717-1b95-4787-9ef1-a99c20a9eda8	3afdd849-04b4-4afb-b630-91384b53a83d	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-27 20:00:00	\N	pending	evening	1	f
ff717cd8-d6a6-427e-bbe6-407394ed1c9e	ed171c01-cfa0-4187-ae69-454801016b0a	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-20 09:00:00	\N	pending	morning	1	f
ae530ad9-da4d-46bb-ae98-a8a5e9520d1c	ed171c01-cfa0-4187-ae69-454801016b0a	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-20 14:00:00	\N	pending	afternoon	1	f
f3ee6986-dd72-4ecd-9760-781002cf8edb	ed171c01-cfa0-4187-ae69-454801016b0a	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-20 20:00:00	\N	pending	evening	1	f
1ad23acb-4f9e-4891-a7c4-6cdd41d00b3a	ed171c01-cfa0-4187-ae69-454801016b0a	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-21 09:00:00	\N	pending	morning	1	f
8a515d78-e9e3-4167-9e6e-d75ca6d4ff83	ed171c01-cfa0-4187-ae69-454801016b0a	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-21 14:00:00	\N	pending	afternoon	1	f
2d5ce70c-afed-4d91-8643-2fd181f72cd4	ed171c01-cfa0-4187-ae69-454801016b0a	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-21 20:00:00	\N	pending	evening	1	f
65ea8433-42e5-4a3c-8291-7b338ebb5c00	ed171c01-cfa0-4187-ae69-454801016b0a	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-22 09:00:00	\N	pending	morning	1	f
8fe8bc52-d413-426a-86d7-661ca4559d56	ed171c01-cfa0-4187-ae69-454801016b0a	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-22 14:00:00	\N	pending	afternoon	1	f
e28fcdac-9ab5-4555-9f17-970a29c2a902	ed171c01-cfa0-4187-ae69-454801016b0a	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-22 20:00:00	\N	pending	evening	1	f
d1674e97-df55-48c4-b9a0-811d54c68678	ed171c01-cfa0-4187-ae69-454801016b0a	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-23 09:00:00	\N	pending	morning	1	f
1aaa8e66-3a57-45ea-bddc-a8212566dd5c	ed171c01-cfa0-4187-ae69-454801016b0a	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-23 14:00:00	\N	pending	afternoon	1	f
ae3cae4e-bc3c-48de-bcaa-1c27a8349d18	ed171c01-cfa0-4187-ae69-454801016b0a	997621a6-b110-4f5e-bb09-573223cbcf39	2026-05-23 20:00:00	\N	pending	evening	1	f
ddf44e31-bd89-4862-9b5a-ceb3c345f78a	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-19 09:00:00	\N	missed	morning	2	t
462d5527-51bc-4393-9819-1dc1b71b64ae	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-19 20:00:00	\N	missed	evening	2	t
79276404-720d-4a6d-b566-ffefdcc6c101	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-20 09:00:00	\N	missed	morning	2	t
11149a4b-716e-4cb3-aab9-6c86f04630e0	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-20 20:00:00	\N	missed	evening	2	t
8650f634-f7dc-4f7e-97f0-9548cae267b5	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-21 09:00:00	\N	missed	morning	2	t
a2e127af-a06c-49a1-b2db-0444e7e714d0	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-21 20:00:00	\N	missed	evening	2	t
befb86fb-3ccb-4ecf-b95b-e4bcadcca4fa	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-22 09:00:00	\N	missed	morning	2	t
38fcd5ce-e8be-4b98-8342-55b14f4d8b6f	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-22 20:00:00	\N	missed	evening	2	t
285ea843-e29e-48ab-ae2b-087e36fb40bd	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-23 09:00:00	\N	missed	morning	2	t
b97d02b8-492e-4d66-9e23-715d21ea1270	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-23 20:00:00	\N	missed	evening	2	t
bb28503e-298a-4173-a239-136ee9250763	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-24 09:00:00	\N	missed	morning	2	t
23ac22a9-067c-417d-87a4-aac44d83a44a	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-24 20:00:00	\N	missed	evening	2	t
451ac302-133b-46c6-b674-6cad9c4b5bdf	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-25 09:00:00	\N	missed	morning	2	t
57d6a139-05f5-421f-b5b3-012d5bbc9464	681df7c9-56b6-4815-9253-125b47f2f5cb	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-25 20:00:00	\N	missed	evening	1	t
7a1f9720-9b3f-4eba-963a-8d667c027453	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-25 20:00:00	\N	missed	evening	2	t
25421c57-a19b-4912-aa54-b8f61308bc74	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-26 09:00:00	\N	missed	morning	2	t
12de63e8-d97f-42a8-b8a4-474a3329aebc	681df7c9-56b6-4815-9253-125b47f2f5cb	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-26 20:00:00	\N	missed	evening	1	t
3abe905e-69f0-4ec8-81ce-cdc8f5d3ae5f	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-26 20:00:00	\N	missed	evening	2	t
a9214674-5929-4a8f-bb81-963978352ca6	681df7c9-56b6-4815-9253-125b47f2f5cb	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-27 09:00:00	\N	missed	morning	4	t
d2b21c73-124b-444a-94c3-dbe501280d42	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-27 09:00:00	\N	missed	morning	2	t
231194f9-42fb-4152-88ca-eddbca08b232	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-27 20:00:00	\N	missed	evening	2	t
a520c825-06f2-46b5-8392-9ef776b26078	681df7c9-56b6-4815-9253-125b47f2f5cb	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-27 20:00:00	\N	missed	evening	1	t
2afd0c93-f200-4c95-931e-2ff534d575fa	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-28 09:00:00	\N	missed	morning	2	t
909857fb-3af0-40f9-885c-607b66df591b	681df7c9-56b6-4815-9253-125b47f2f5cb	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-28 09:00:00	\N	missed	morning	4	t
6a2e07f0-f290-4211-9243-5e2a68440462	10ed3861-8504-44b9-a89a-d25608255daf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-28 20:00:00	\N	missed	evening	2	t
0a56673e-c289-4b47-91af-756666bd4426	681df7c9-56b6-4815-9253-125b47f2f5cb	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	2026-05-28 20:00:00	\N	missed	evening	1	t
\.


--
-- TOC entry 5321 (class 0 OID 17099)
-- Dependencies: 225
-- Data for Name: medications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.medications (medication_id, name, type, description, status) FROM stdin;
cb7b9b12-80db-4103-9134-c6ae08d515b7	Paracetamol	Tablet	Pain reliever	approved
3dc6e5fc-74ee-4b4b-93e8-8157b7c90b87	Ibuprofen	Tablet	Anti-inflammatory	approved
6c382396-4708-4f81-938e-e2ae16afe678	Amoxicillin	Capsule	Antibiotic	approved
c0b3ecb1-fbb0-4a5b-adfa-fd7b2a4aa1d8	Panadol Syrup	Syrup	Fever reducer	approved
0475d3c7-0de5-436e-bfb5-bf1b4ff78a5e	Vitamin C	Supplement	Immunity booster	approved
0eff3530-1ec1-4e38-bd54-d4d7b741aea7	Insulin	Dash	For Isfa	approved
\.


--
-- TOC entry 5336 (class 0 OID 17401)
-- Dependencies: 240
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (notification_id, user_id, type, title, body, reference_id, reference_type, is_read, created_at) FROM stdin;
00a32f42-a13c-483e-8587-a493dc4b7e3f	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	info	Welcome	Welcome to the system	\N	\N	f	2026-04-28 16:16:19.867623
011d6845-5427-4f8a-8102-1ff9d59892e5	194d097e-b430-4d5f-ae54-ca6ea35dd857	info	Welcome	Welcome to the system	\N	\N	f	2026-04-28 16:16:19.867623
01bc8880-1420-4dce-81ef-e29dbf3493b9	3b52f039-5e43-4858-92a0-f4d1019bab83	info	Welcome	Welcome to the system	\N	\N	f	2026-04-28 16:16:19.867623
e14c9486-6205-42e1-bc32-5ec8d9e0afc4	8838004a-9915-4fe6-8d9b-69b126ba22b0	info	Welcome	Welcome to the system	\N	\N	f	2026-04-28 16:16:19.867623
7477974a-0d84-4ae4-bf99-39cce7b6f9f7	09f99c55-20e8-4e86-a7ba-01f655e26a6a	info	Welcome	Welcome to the system	\N	\N	f	2026-04-28 16:16:19.867623
22359308-a98b-45b1-b91a-8e463261630c	87a8d557-d37a-4ade-bc34-978ef2c4a322	info	Welcome	Welcome to the system	\N	\N	f	2026-04-28 16:16:19.867623
4a1f997d-b370-4a92-84a6-5fc9039f2437	0cfb955b-5284-4ed0-bbcc-2f29085cf65e	info	Welcome	Welcome to the system	\N	\N	f	2026-04-28 16:16:19.867623
bd4d32a0-56b0-43aa-991b-724f8c4ab637	aa4a604a-6260-4568-a7be-afef4fcdcc83	info	Welcome	Welcome to the system	\N	\N	f	2026-04-28 16:16:19.867623
a0323f97-8670-4500-8e57-986491888461	20a16369-e2ab-403e-a650-e1bd3fd0090a	info	Welcome	Welcome to the system	\N	\N	f	2026-04-28 16:16:19.867623
2d1cde82-3d81-473b-bca7-72498afece94	6a9e8b60-5ce7-4965-b726-c3e1335ae80b	info	Welcome	Welcome to the system	\N	\N	f	2026-04-28 16:16:19.867623
3cbdd2de-fe9a-420a-8e31-bd8b2a2ea38e	31adc1f3-7294-48a4-bbae-158c72795028	info	Welcome	Welcome to the system	\N	\N	f	2026-04-28 16:16:19.867623
b8a31387-7b15-4a51-92c4-37cd94019820	2a5a1644-9799-4f9f-8d7d-3efe49e07dbc	info	Welcome	Welcome to the system	\N	\N	f	2026-04-28 16:16:19.867623
45bb09c1-d73c-470c-9ef1-9074d898dbb2	908990f4-84a5-4e87-879c-294bc339b9a9	info	Welcome	Welcome to the system	\N	\N	f	2026-04-28 16:16:19.867623
6722eda5-177d-4d8f-bd8f-dd63a961b5ac	70edd123-38bc-4816-a27d-988d33612e6f	info	Welcome	Welcome to the system	\N	\N	f	2026-04-28 16:16:19.867623
972dccea-d77e-48f5-a9ac-8f3e5c6cf350	614b9904-f1c8-4f79-969a-b3af41f8002a	info	Welcome	Welcome to the system	\N	\N	f	2026-04-28 16:16:19.867623
d52978bc-ec9a-4b39-951d-df839a5985ac	def4be95-88f1-4bfe-819e-5443b6cec18d	info	Welcome	Welcome to the system	\N	\N	f	2026-04-28 16:16:19.867623
cfdb723b-b436-4dda-8f79-c8c1da1f6ecb	046468d7-29c0-4232-bab7-57f82be30862	info	Welcome	Welcome to the system	\N	\N	f	2026-04-28 16:16:19.867623
2547e338-8cc1-4c4b-bcd1-440a3b4eea93	7087e403-8596-4873-a4d7-6d259467701b	info	Welcome	Welcome to the system	\N	\N	f	2026-04-28 16:16:19.867623
f41cd6d7-6942-4bd6-a91f-992702ed8735	ac64cee1-c3cb-4ec0-a2fc-beafee9bac8d	info	Welcome	Welcome to the system	\N	\N	f	2026-04-28 16:16:19.867623
4f96285e-d600-4423-bfcc-2ce4415ca0ee	42b4b367-4809-4139-9a93-464a09ab1c4f	info	Welcome	Welcome to the system	\N	\N	f	2026-04-28 16:16:19.867623
eaf319c1-edeb-4303-abc8-2dae65f7edfa	e5acd622-2706-4a0d-8583-1870a1e82861	alert	Hypertensive Crisis	Systolic Blood Pressure spiked to 500.	6293eb31-b750-484e-a060-9f9cca0ec344	alert	f	2026-05-10 14:51:16.273652
1661d3c7-11af-48cd-89fb-0be47efabade	4a790890-5573-463a-aaf2-a2d32eefd04a	info	Appointment cancelled	Appointment with patient for 13-Jun-2026, 6:58 pm has been cancelled.	12f3084a-1259-4d40-a1d3-72860ef84173	appointment	f	2026-05-17 12:00:25.109857
4853e8a8-f0f7-4a82-abf4-aa6a8dd62eef	4a790890-5573-463a-aaf2-a2d32eefd04a	info	Appointment cancelled	Appointment with patient for 14-May-2026, 11:26 pm has been cancelled.	bcabfce9-ff76-4d00-b965-0f9a2a486787	appointment	f	2026-05-17 13:37:10.888636
474cebeb-1200-42cb-a92c-e02397a2b08d	4a790890-5573-463a-aaf2-a2d32eefd04a	info	Appointment cancelled	Appointment with patient for 15-May-2026, 4:00 am has been cancelled.	067d54e3-672f-4874-86eb-2c605726fdd8	appointment	f	2026-05-17 13:37:57.927118
439669d2-9e9c-4f48-ac64-ce16daf5758b	1375627f-98f3-47d0-9e68-3e92b69cf5f3	info	Appointment cancelled	Appointment with patient for 22-May-2026, 9:00 am has been cancelled.	7e32b81d-033e-4fd7-874c-484e6204febf	appointment	t	2026-05-17 12:00:31.325419
6f78409c-230e-429e-bc66-2141e158dea8	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Severe Hyperglycemia	Blood glucose logged at 500 mg/dL (very high).	1ca0d01e-7abd-4626-95bc-d63af8ad36df	alert	t	2026-05-15 00:17:07.305046
85cfd461-a252-4bc4-afa0-1231a91902b1	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Medication dose missed	A scheduled dose was marked as missed. Review your medications and contact your clinician if needed.	d1e358ec-aec0-484c-9ff4-1afbdcd29bd9	medication_log	t	2026-05-15 00:19:26.200199
e3459993-9d7b-4242-937a-b5827c7dd241	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Medication dose missed	A scheduled dose was marked as missed. Review your medications and contact your clinician if needed.	d1e358ec-aec0-484c-9ff4-1afbdcd29bd9	medication_log	t	2026-05-15 00:19:28.769492
f7f27d45-9c3f-4cf0-b47e-ab0881fc6c63	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	info	Appointment confirmed	Your appointment for 22-May-2026, 9:00 am has been confirmed.	7e32b81d-033e-4fd7-874c-484e6204febf	appointment	t	2026-05-17 09:58:16.196803
bf278efe-6ee3-4c4d-9d79-5761d34425be	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	info	Appointment cancelled	Your appointment for 13-Jun-2026, 6:58 pm has been cancelled by the doctor.	12f3084a-1259-4d40-a1d3-72860ef84173	appointment	t	2026-05-17 12:00:25.056235
15dbd3d1-3fc5-4c57-890d-200313cfa611	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	info	Appointment cancelled	Your appointment for 22-May-2026, 9:00 am has been cancelled by the doctor.	7e32b81d-033e-4fd7-874c-484e6204febf	appointment	t	2026-05-17 12:00:31.320556
9d0dabcf-045c-4e8c-b0e2-a90c38ed7ebd	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	info	Appointment confirmed	Your appointment for 22-May-2026, 9:00 am has been confirmed.	cd1f0c9e-eb75-4055-b84c-d920dbacfa62	appointment	t	2026-05-17 12:01:11.104573
f842c835-801a-4eba-9687-0003815543e8	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	info	Appointment cancelled	Your appointment for 14-May-2026, 11:26 pm has been cancelled.	bcabfce9-ff76-4d00-b965-0f9a2a486787	appointment	t	2026-05-17 13:37:10.854629
4c5aa6a5-5177-40a3-8b00-a63963dc94f8	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	info	Appointment cancelled	Your appointment for 15-May-2026, 4:00 am has been cancelled.	067d54e3-672f-4874-86eb-2c605726fdd8	appointment	t	2026-05-17 13:37:57.902404
08fb43bc-82fc-4951-828a-280c6a2affd8	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Medication dose missed	A scheduled dose was marked as missed. Review your medications and contact your clinician if needed.	b91ed7c9-40be-4352-bf96-d03cdd1794f4	medication_log	t	2026-05-17 13:58:36.192779
95c07b47-cbd4-4c87-a0cf-a90cbc6d6ea8	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	info	Appointment confirmed	Your appointment for 23-May-2026, 9:00 am has been confirmed.	f0458ea3-64ed-4d4d-9798-bd14fe328563	appointment	t	2026-05-17 18:03:39.920275
8200e8ac-fdc0-4aed-afc6-8025cb6d50b8	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Hypertensive Crisis	Systolic Blood Pressure spiked to 500.	7e514ea0-1514-4245-9d47-7067c0ec2421	alert	t	2026-05-17 18:09:09.138402
fee59654-afc9-48ce-8908-193ad35089ad	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Severe Hyperglycemia	Blood glucose logged at 4999 mg/dL (very high).	d092bdb9-b283-41f9-a0ca-80a000a6814e	alert	t	2026-05-17 18:11:12.011386
b9b10a93-1e28-44e5-97a5-0065ddfd4014	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Morning medication missed	You missed 2 of Paracetamol for the morning dose.	bf9724a5-2d72-4b7c-a759-24c1a4f10102	medication_log	t	2026-05-17 18:41:57.87167
f388bea0-16a6-4119-a5e6-d58aea160d42	c2987363-8e64-4dc2-84fd-1260b0b3bad6	info	Appointment confirmed	Your appointment for 17-May-2026, 9:00 am has been confirmed.	079e227a-c015-443c-b3fc-66dbac0642ec	appointment	t	2026-05-16 13:15:01.409896
097386c7-60a4-4148-9d91-168d8f4d3e3d	c2987363-8e64-4dc2-84fd-1260b0b3bad6	info	Appointment confirmed	Your appointment for 20-May-2026, 9:00 am has been confirmed.	f68c8d87-3466-4c98-8e04-2bf07d64ce76	appointment	t	2026-05-16 13:20:20.843652
05a557e1-fc88-465c-8e5b-a13b5c487bc1	c2987363-8e64-4dc2-84fd-1260b0b3bad6	info	Appointment confirmed	Your appointment for 21-May-2026, 9:00 am has been confirmed.	f33af776-2ccd-4db3-a8ce-4a9ff1c62f64	appointment	t	2026-05-16 13:30:02.923402
e610b0eb-6f49-455e-bebe-649a4107ac88	c2987363-8e64-4dc2-84fd-1260b0b3bad6	alert	Hypertensive Crisis	Systolic Blood Pressure spiked to 500.	74ea4af8-db16-444b-98e9-f36706e8b23b	alert	t	2026-05-17 19:10:32.711107
d473f013-d526-4236-99c6-e2d9bc9b47ae	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Morning medication missed	You missed 2 of Paracetamol for the morning dose.	80c84e3a-1947-48f6-8d94-837b49c2dc6f	medication_log	t	2026-05-18 14:46:01.474219
4371601a-9c9a-4531-a4dc-2796ef3af10e	c2987363-8e64-4dc2-84fd-1260b0b3bad6	info	Appointment confirmed	Your appointment for 19-May-2026, 9:00 am has been confirmed.	003b6f0d-6a38-4748-9bb6-20b2174755ec	appointment	f	2026-05-18 16:38:05.303222
78e67666-fe3f-4830-9286-e51a8b0b396f	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Evening medication missed	You missed 2 of Paracetamol for the evening dose.	6afc3e18-4415-4340-a10a-4adb598eb465	medication_log	t	2026-05-18 23:20:01.472887
2d850db3-15b3-4569-a80a-d4bf155b902e	997621a6-b110-4f5e-bb09-573223cbcf39	info	Appointment confirmed	Your appointment for 24-May-2026, 9:00 am has been confirmed.	aa647fb0-fdb9-498b-a85b-029b9c1517c2	appointment	t	2026-05-18 16:57:23.623934
bbb7a161-065e-40ec-84ae-6c57d888b5b8	997621a6-b110-4f5e-bb09-573223cbcf39	info	Appointment confirmed	Your appointment for 23-May-2026, 9:00 am has been confirmed.	19efbc18-2d73-48b4-866f-0547fcaf4892	appointment	t	2026-05-18 22:59:56.969169
dfbaae0a-95b7-429a-94e2-67c212434208	997621a6-b110-4f5e-bb09-573223cbcf39	info	Appointment confirmed	Your appointment for 19-May-2026, 12:00 am has been confirmed.	5ffbabe1-5950-4097-a027-b2cc4f2e09c2	appointment	t	2026-05-18 23:45:50.741783
b7394828-11bd-4597-8a2a-7079bd59ab43	997621a6-b110-4f5e-bb09-573223cbcf39	info	Appointment confirmed	Your appointment for 19-May-2026, 12:30 am has been confirmed.	3d8a6cf6-3f50-49fa-ad8e-faa917de56ae	appointment	f	2026-05-19 00:15:32.29301
85f55b3e-6cb8-4ce4-8cae-7803f5253d25	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Morning medication missed	You missed 2 of Paracetamol for the morning dose.	ddf44e31-bd89-4862-9b5a-ceb3c345f78a	medication_log	f	2026-05-29 01:48:25.461148
de19bb89-8908-4b60-a4f4-fb752d185852	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Evening medication missed	You missed 2 of Paracetamol for the evening dose.	462d5527-51bc-4393-9819-1dc1b71b64ae	medication_log	f	2026-05-29 01:48:26.009018
8f4b982f-c826-4943-822e-40fe3bfe4bc3	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Morning medication missed	You missed 2 of Paracetamol for the morning dose.	79276404-720d-4a6d-b566-ffefdcc6c101	medication_log	f	2026-05-29 01:48:26.036287
aa8ee8e7-e8fb-4d8d-8f3c-5d242e04feba	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Evening medication missed	You missed 2 of Paracetamol for the evening dose.	11149a4b-716e-4cb3-aab9-6c86f04630e0	medication_log	f	2026-05-29 01:48:26.136778
cd8126f9-d2dc-4985-8526-6ac1d466e690	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Morning medication missed	You missed 2 of Paracetamol for the morning dose.	8650f634-f7dc-4f7e-97f0-9548cae267b5	medication_log	f	2026-05-29 01:48:26.153882
9e46ade8-58fc-4363-b351-ff2c9390938c	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Evening medication missed	You missed 2 of Paracetamol for the evening dose.	a2e127af-a06c-49a1-b2db-0444e7e714d0	medication_log	f	2026-05-29 01:48:26.161159
58aefc75-4590-4b1d-b4db-5e5fac62a8c7	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Morning medication missed	You missed 2 of Paracetamol for the morning dose.	befb86fb-3ccb-4ecf-b95b-e4bcadcca4fa	medication_log	f	2026-05-29 01:48:26.167281
39fffe76-4e83-41b8-aa5b-a7849dfd2dc5	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Evening medication missed	You missed 2 of Paracetamol for the evening dose.	38fcd5ce-e8be-4b98-8342-55b14f4d8b6f	medication_log	f	2026-05-29 01:48:26.174445
d6575362-2b11-402a-904d-63fc80c05221	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Morning medication missed	You missed 2 of Paracetamol for the morning dose.	285ea843-e29e-48ab-ae2b-087e36fb40bd	medication_log	f	2026-05-29 01:48:26.181663
30d15eb2-d2b4-4729-aaac-8fb05818cda9	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Evening medication missed	You missed 2 of Paracetamol for the evening dose.	b97d02b8-492e-4d66-9e23-715d21ea1270	medication_log	f	2026-05-29 01:48:26.187123
bdc83594-2474-458a-9efe-132409171b2b	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Morning medication missed	You missed 2 of Paracetamol for the morning dose.	bb28503e-298a-4173-a239-136ee9250763	medication_log	f	2026-05-29 01:48:26.193853
84e08735-39fd-40f2-abeb-1e755c9e7711	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Evening medication missed	You missed 2 of Paracetamol for the evening dose.	23ac22a9-067c-417d-87a4-aac44d83a44a	medication_log	f	2026-05-29 01:48:26.199748
1c625722-15fd-4275-8a7d-09309d739fde	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Morning medication missed	You missed 4 of Ibuprofen for the morning dose.	0520825c-c8f4-48ae-955d-14ac80dc8cce	medication_log	f	2026-05-29 01:48:26.205589
bee608ee-be8e-472d-babf-944fdca2df9e	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Morning medication missed	You missed 2 of Paracetamol for the morning dose.	451ac302-133b-46c6-b674-6cad9c4b5bdf	medication_log	f	2026-05-29 01:48:26.210983
55c96349-81d2-4093-bdf3-e29b7cc4eacf	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Evening medication missed	You missed 1 of Ibuprofen for the evening dose.	57d6a139-05f5-421f-b5b3-012d5bbc9464	medication_log	f	2026-05-29 01:48:26.216805
1165e0b2-f0bf-4152-b726-680481c1c2f9	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Evening medication missed	You missed 2 of Paracetamol for the evening dose.	7a1f9720-9b3f-4eba-963a-8d667c027453	medication_log	f	2026-05-29 01:48:26.222838
c52c1ba4-c174-42fa-8f2e-f878dc9b04a8	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Morning medication missed	You missed 2 of Paracetamol for the morning dose.	25421c57-a19b-4912-aa54-b8f61308bc74	medication_log	f	2026-05-29 01:48:26.228984
35511559-358e-4ca6-ba9e-184a4baf7a5b	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Evening medication missed	You missed 1 of Ibuprofen for the evening dose.	12de63e8-d97f-42a8-b8a4-474a3329aebc	medication_log	f	2026-05-29 01:48:26.234509
c72b631a-66a2-4f0f-b899-4942ca1eb6e0	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Evening medication missed	You missed 2 of Paracetamol for the evening dose.	3abe905e-69f0-4ec8-81ce-cdc8f5d3ae5f	medication_log	f	2026-05-29 01:48:26.240973
457b8ced-0506-4a07-86b3-3614146fa233	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Morning medication missed	You missed 4 of Ibuprofen for the morning dose.	a9214674-5929-4a8f-bb81-963978352ca6	medication_log	f	2026-05-29 01:48:26.246259
a4bfcf84-c66a-4dfd-ae7e-100efdaceff5	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Morning medication missed	You missed 2 of Paracetamol for the morning dose.	d2b21c73-124b-444a-94c3-dbe501280d42	medication_log	f	2026-05-29 01:48:26.252665
24dc126b-dbf2-4d50-85a1-606246c53494	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Evening medication missed	You missed 2 of Paracetamol for the evening dose.	231194f9-42fb-4152-88ca-eddbca08b232	medication_log	f	2026-05-29 01:48:26.258091
ba947c9f-503f-410d-8a0c-9c7437e2a2dc	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Evening medication missed	You missed 1 of Ibuprofen for the evening dose.	a520c825-06f2-46b5-8392-9ef776b26078	medication_log	f	2026-05-29 01:48:26.263832
bf0f38fe-5af6-4452-9026-7757bc96d64b	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Morning medication missed	You missed 2 of Paracetamol for the morning dose.	2afd0c93-f200-4c95-931e-2ff534d575fa	medication_log	f	2026-05-29 01:48:26.270348
f9c9f948-70e5-4f99-89e6-f5ded06b13bd	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Morning medication missed	You missed 4 of Ibuprofen for the morning dose.	909857fb-3af0-40f9-885c-607b66df591b	medication_log	f	2026-05-29 01:48:26.276989
c9686ca0-afc1-4d0a-b83a-7040d4a7c4e7	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Evening medication missed	You missed 2 of Paracetamol for the evening dose.	6a2e07f0-f290-4211-9243-5e2a68440462	medication_log	f	2026-05-29 01:48:26.281946
f411ada4-a81d-4ae6-9772-1fc716904abe	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	alert	Evening medication missed	You missed 1 of Ibuprofen for the evening dose.	0a56673e-c289-4b47-91af-756666bd4426	medication_log	f	2026-05-29 01:48:26.300776
\.


--
-- TOC entry 5322 (class 0 OID 17110)
-- Dependencies: 226
-- Data for Name: patient_medications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patient_medications (patient_medication_id, prescription_id, patient_user_id, medication_id, dosage, frequency, start_date, end_date, dosage_schedule) FROM stdin;
540dc9d2-143c-45b7-b6f9-517b7d91ce8c	3f174914-8e47-44f5-b34e-c2e1fd232c66	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	cb7b9b12-80db-4103-9134-c6ae08d515b7	1 tablet	2 times a day	2026-04-28	2026-05-03	\N
d5bb9e1a-eb52-450d-a384-1eacb598b33f	3f174914-8e47-44f5-b34e-c2e1fd232c66	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	3dc6e5fc-74ee-4b4b-93e8-8157b7c90b87	1 tablet	2 times a day	2026-04-28	2026-05-03	\N
c00ee85f-e45d-4bdf-8e43-e9dd63b2feb2	3f174914-8e47-44f5-b34e-c2e1fd232c66	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	6c382396-4708-4f81-938e-e2ae16afe678	1 tablet	2 times a day	2026-04-28	2026-05-03	\N
5c49c2e0-f6be-4298-adbd-947d8744c3c0	3f174914-8e47-44f5-b34e-c2e1fd232c66	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	c0b3ecb1-fbb0-4a5b-adfa-fd7b2a4aa1d8	1 tablet	2 times a day	2026-04-28	2026-05-03	\N
43836e21-982f-4675-b0a3-5fe5b5d370eb	3f174914-8e47-44f5-b34e-c2e1fd232c66	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	0475d3c7-0de5-436e-bfb5-bf1b4ff78a5e	1 tablet	2 times a day	2026-04-28	2026-05-03	\N
caa09d3e-d926-4694-8c31-91ca9432c7d7	5115454d-fadf-47b1-a713-df6838657775	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	cb7b9b12-80db-4103-9134-c6ae08d515b7	1 tablet	2 times a day	2026-04-28	2026-05-03	\N
fef3d70c-febe-48e8-8eaf-82a4fd078ef2	5115454d-fadf-47b1-a713-df6838657775	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	3dc6e5fc-74ee-4b4b-93e8-8157b7c90b87	1 tablet	2 times a day	2026-04-28	2026-05-03	\N
4137777a-b0ca-439f-a23a-879592594dc4	5115454d-fadf-47b1-a713-df6838657775	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	6c382396-4708-4f81-938e-e2ae16afe678	1 tablet	2 times a day	2026-04-28	2026-05-03	\N
61e96171-e1d5-4894-9d2f-8f4bf94aa4f1	5115454d-fadf-47b1-a713-df6838657775	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	c0b3ecb1-fbb0-4a5b-adfa-fd7b2a4aa1d8	1 tablet	2 times a day	2026-04-28	2026-05-03	\N
2939ed97-576e-45c2-9ebc-29c02c5fc2b2	5115454d-fadf-47b1-a713-df6838657775	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	0475d3c7-0de5-436e-bfb5-bf1b4ff78a5e	1 tablet	2 times a day	2026-04-28	2026-05-03	\N
94ada8fb-00b7-48e7-8685-b297e6c6e0da	03c31747-3f59-447d-8bd9-5bc2969c15e7	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	cb7b9b12-80db-4103-9134-c6ae08d515b7	1 tablet	2 times a day	2026-04-28	2026-05-03	\N
77fd81f7-be3a-4431-9dee-8e6243d8db46	03c31747-3f59-447d-8bd9-5bc2969c15e7	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	3dc6e5fc-74ee-4b4b-93e8-8157b7c90b87	1 tablet	2 times a day	2026-04-28	2026-05-03	\N
f21ed05d-3593-4750-b0ec-f150f1468b92	03c31747-3f59-447d-8bd9-5bc2969c15e7	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	6c382396-4708-4f81-938e-e2ae16afe678	1 tablet	2 times a day	2026-04-28	2026-05-03	\N
7213c8a9-9531-4c1e-8a4d-397a3feaf31d	03c31747-3f59-447d-8bd9-5bc2969c15e7	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	c0b3ecb1-fbb0-4a5b-adfa-fd7b2a4aa1d8	1 tablet	2 times a day	2026-04-28	2026-05-03	\N
bcc1bdf8-60f1-414c-848d-a489a07846f1	03c31747-3f59-447d-8bd9-5bc2969c15e7	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	0475d3c7-0de5-436e-bfb5-bf1b4ff78a5e	1 tablet	2 times a day	2026-04-28	2026-05-03	\N
30edfcd4-95cd-4a4d-af87-7a3723c00d5d	7b6048bf-6801-4c69-af7e-72073d288473	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	cb7b9b12-80db-4103-9134-c6ae08d515b7	1 tablet	2 times a day	2026-04-28	2026-05-03	\N
baed39f8-df0d-4f8c-a44e-ca603986f423	7b6048bf-6801-4c69-af7e-72073d288473	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	3dc6e5fc-74ee-4b4b-93e8-8157b7c90b87	1 tablet	2 times a day	2026-04-28	2026-05-03	\N
2bc596a8-b827-4956-9f78-56fa302bf171	7b6048bf-6801-4c69-af7e-72073d288473	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	6c382396-4708-4f81-938e-e2ae16afe678	1 tablet	2 times a day	2026-04-28	2026-05-03	\N
4bf1c878-0496-4e02-b818-b30628d44735	7b6048bf-6801-4c69-af7e-72073d288473	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	c0b3ecb1-fbb0-4a5b-adfa-fd7b2a4aa1d8	1 tablet	2 times a day	2026-04-28	2026-05-03	\N
94e0eadc-4fb3-493e-9c3f-ec82027054c0	7b6048bf-6801-4c69-af7e-72073d288473	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	0475d3c7-0de5-436e-bfb5-bf1b4ff78a5e	1 tablet	2 times a day	2026-04-28	2026-05-03	\N
0de35e38-c9e1-460c-b6fa-44efd6df7be9	23f9b767-1161-4b3b-bc1b-77bb01d10749	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	c0b3ecb1-fbb0-4a5b-adfa-fd7b2a4aa1d8	2	2	\N	\N	\N
70c926da-d6f2-4544-ac3a-2277b0f02e5b	23f9b767-1161-4b3b-bc1b-77bb01d10749	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	0475d3c7-0de5-436e-bfb5-bf1b4ff78a5e	3	1	2026-05-20	2026-05-25	\N
d39ac0fd-2034-48f2-8ade-d2be2e67bb48	8f43ca99-1c20-40b5-a9cd-7da7f2144fc7	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	3dc6e5fc-74ee-4b4b-93e8-8157b7c90b87	3	2	2026-05-19	2026-05-23	\N
c5f2cf93-a44a-481e-a5f7-f8d6b348a1ba	a037c82d-7bde-4e81-ac8c-e909a4d71c10	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	3dc6e5fc-74ee-4b4b-93e8-8157b7c90b87	1	1	2026-05-27	2026-05-29	\N
3fdb805c-c706-451b-bb12-98eee89ae883	a037c82d-7bde-4e81-ac8c-e909a4d71c10	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	6c382396-4708-4f81-938e-e2ae16afe678	3	1	\N	\N	\N
0ede12c1-1106-4260-8562-22666337909b	b430788e-2e86-4b0f-9a21-d4d0a90cdd21	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	cb7b9b12-80db-4103-9134-c6ae08d515b7	7	7	2026-05-29	2026-05-30	\N
236a4e54-a1b8-4e27-aaab-fdd18e05ce3b	b430788e-2e86-4b0f-9a21-d4d0a90cdd21	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	6c382396-4708-4f81-938e-e2ae16afe678	5	3	2026-05-26	2026-05-30	\N
df9ea489-7822-4161-8fdf-e388eeae1463	b430788e-2e86-4b0f-9a21-d4d0a90cdd21	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	0475d3c7-0de5-436e-bfb5-bf1b4ff78a5e	1	1	\N	\N	\N
2a29e6a6-a336-4645-bd21-c222ff2ace2e	23f9b767-1161-4b3b-bc1b-77bb01d10749	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	c0b3ecb1-fbb0-4a5b-adfa-fd7b2a4aa1d8	21	12	\N	\N	\N
10ed3861-8504-44b9-a89a-d25608255daf	b430788e-2e86-4b0f-9a21-d4d0a90cdd21	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	cb7b9b12-80db-4103-9134-c6ae08d515b7	Morning: 2, Evening: 2	Morning, Evening	2026-05-17	2026-05-30	{"evening": "2", "morning": "2"}
681df7c9-56b6-4815-9253-125b47f2f5cb	b430788e-2e86-4b0f-9a21-d4d0a90cdd21	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	3dc6e5fc-74ee-4b4b-93e8-8157b7c90b87	Morning: 4, Evening: 1	Morning, Evening	2026-05-25	2026-05-30	{"evening": "1", "morning": "4"}
3afdd849-04b4-4afb-b630-91384b53a83d	fd311590-b970-4258-91bb-920fb36211b5	997621a6-b110-4f5e-bb09-573223cbcf39	0eff3530-1ec1-4e38-bd54-d4d7b741aea7	Morning: 1, Afternoon: 1, Evening: 1	Morning, Afternoon, Evening	2026-05-19	2026-05-27	{"evening": "1", "morning": "1", "afternoon": "1"}
ed171c01-cfa0-4187-ae69-454801016b0a	7aaea53b-6e59-4a78-8cce-d3aa23882c71	997621a6-b110-4f5e-bb09-573223cbcf39	0eff3530-1ec1-4e38-bd54-d4d7b741aea7	Morning: 1, Afternoon: 1, Evening: 1	Morning, Afternoon, Evening	2026-05-20	2026-05-23	{"evening": "1", "morning": "1", "afternoon": "1"}
\.


--
-- TOC entry 5320 (class 0 OID 17072)
-- Dependencies: 224
-- Data for Name: prescriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prescriptions (prescription_id, patient_user_id, doctor_user_id, appointment_id, diagnosis, diagnosis_notes, symptoms_notes, prescribed_at, follow_up_date) FROM stdin;
3f174914-8e47-44f5-b34e-c2e1fd232c66	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	3b52f039-5e43-4858-92a0-f4d1019bab83	69d0a7cd-4783-4dbd-85c9-c0f19e8bd5b1	Flu	Mild viral infection	Fever, cough, headache	2026-04-28 16:16:19.867623	\N
5115454d-fadf-47b1-a713-df6838657775	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	8838004a-9915-4fe6-8d9b-69b126ba22b0	61c57d67-e48d-44c5-b4b8-3fc06d4a455d	Flu	Mild viral infection	Fever, cough, headache	2026-04-28 16:16:19.867623	\N
03c31747-3f59-447d-8bd9-5bc2969c15e7	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	aa4a604a-6260-4568-a7be-afef4fcdcc83	a355db0c-f573-41e8-9b95-9299590e3084	Flu	Mild viral infection	Fever, cough, headache	2026-04-28 16:16:19.867623	\N
7b6048bf-6801-4c69-af7e-72073d288473	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	6a9e8b60-5ce7-4965-b726-c3e1335ae80b	9b54faf9-b382-4508-8614-ff20fbd03b92	Flu	Mild viral infection	Fever, cough, headache	2026-04-28 16:16:19.867623	\N
2882c00f-821d-4e8e-b526-6fd62a8fe164	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	31adc1f3-7294-48a4-bbae-158c72795028	9a24c18e-5bff-4814-8547-2992dd5e33c4	Flu	Mild viral infection	Fever, cough, headache	2026-04-28 16:16:19.867623	\N
9eb06fbd-41e8-4934-ae47-b46cab9288e9	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	614b9904-f1c8-4f79-969a-b3af41f8002a	3ce53aa6-78a6-4afc-888d-4b29634e565c	Flu	Mild viral infection	Fever, cough, headache	2026-04-28 16:16:19.867623	\N
ca7fcee8-3528-4c08-89bf-71c63c629f49	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	7087e403-8596-4873-a4d7-6d259467701b	0e16172b-0c91-4399-aafb-3cfb2be654b5	Flu	Mild viral infection	Fever, cough, headache	2026-04-28 16:16:19.867623	\N
4de56ba5-e6da-45ee-9bd7-d5340c25ca4f	194d097e-b430-4d5f-ae54-ca6ea35dd857	3b52f039-5e43-4858-92a0-f4d1019bab83	f5650692-d3d7-4aa8-a471-b9b69908c33f	Flu	Mild viral infection	Fever, cough, headache	2026-04-28 16:16:19.867623	\N
0a2d99fb-b201-4376-b9d8-9b1af52abcb0	194d097e-b430-4d5f-ae54-ca6ea35dd857	8838004a-9915-4fe6-8d9b-69b126ba22b0	27dfff6b-b0d0-428d-b3c5-52c7c7f6d4ce	Flu	Mild viral infection	Fever, cough, headache	2026-04-28 16:16:19.867623	\N
0f8e12b8-02fa-47ea-935a-4532085b67b9	194d097e-b430-4d5f-ae54-ca6ea35dd857	aa4a604a-6260-4568-a7be-afef4fcdcc83	768dcfa3-0ea6-40e3-b1cd-488a5304b235	Flu	Mild viral infection	Fever, cough, headache	2026-04-28 16:16:19.867623	\N
ad2368bc-1bac-476f-9d55-bd79256d2176	194d097e-b430-4d5f-ae54-ca6ea35dd857	6a9e8b60-5ce7-4965-b726-c3e1335ae80b	12e5fd79-11d3-4227-b4f1-1b9959ce9ecc	Flu	Mild viral infection	Fever, cough, headache	2026-04-28 16:16:19.867623	\N
ede9bab7-3677-4489-a2cf-386d927a7c6b	194d097e-b430-4d5f-ae54-ca6ea35dd857	31adc1f3-7294-48a4-bbae-158c72795028	272679fd-6af6-491c-9385-64ab43547eff	Flu	Mild viral infection	Fever, cough, headache	2026-04-28 16:16:19.867623	\N
f969c642-584c-4407-84c5-290efa287e33	194d097e-b430-4d5f-ae54-ca6ea35dd857	614b9904-f1c8-4f79-969a-b3af41f8002a	a1b4f436-262a-48e2-b3dc-37faa6a0fa54	Flu	Mild viral infection	Fever, cough, headache	2026-04-28 16:16:19.867623	\N
a3dc147a-c302-479b-a383-24787b3e32aa	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	3b52f039-5e43-4858-92a0-f4d1019bab83	c69bce10-6856-4fcb-b056-4493e6780266	Flu	Mild viral infection	Fever, cough, headache	2026-04-28 16:16:19.867623	\N
23f9b767-1161-4b3b-bc1b-77bb01d10749	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	4a790890-5573-463a-aaf2-a2d32eefd04a	\N	Diabetes 	Bohot meetha khati he	Kam khaya karo	2026-05-15 00:36:19.538274	1223-05-13
8f43ca99-1c20-40b5-a9cd-7da7f2144fc7	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	1375627f-98f3-47d0-9e68-3e92b69cf5f3	\N	Fever	Due to diabetes 	High fever	2026-05-17 10:08:12.75875	2026-05-29
a037c82d-7bde-4e81-ac8c-e909a4d71c10	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	1375627f-98f3-47d0-9e68-3e92b69cf5f3	\N	Heart			2026-05-17 10:18:27.166895	2026-05-29
b430788e-2e86-4b0f-9a21-d4d0a90cdd21	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	1375627f-98f3-47d0-9e68-3e92b69cf5f3	\N	Testing	Testing	Testing	2026-05-17 12:01:30.330783	2026-05-23
fd311590-b970-4258-91bb-920fb36211b5	997621a6-b110-4f5e-bb09-573223cbcf39	1375627f-98f3-47d0-9e68-3e92b69cf5f3	\N	Sugar	kam khaya karo meetha	baaz nahi ati	2026-05-18 22:53:51.259422	2026-05-27
c44bf76f-b6fa-48a0-aa36-d48a5eefa33a	997621a6-b110-4f5e-bb09-573223cbcf39	1375627f-98f3-47d0-9e68-3e92b69cf5f3	\N	Diabetes	bohot acha lag raha he	bohot neend a rahi he	2026-05-18 22:55:37.075103	2026-05-30
7aaea53b-6e59-4a78-8cce-d3aa23882c71	997621a6-b110-4f5e-bb09-573223cbcf39	1375627f-98f3-47d0-9e68-3e92b69cf5f3	\N	isfa	mic open karo	agar tum dekh rahi ho	2026-05-18 23:00:30.011507	2026-05-20
\.


--
-- TOC entry 5318 (class 0 OID 17023)
-- Dependencies: 222
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, full_name, email, password_hash, role, profile_picture, phone, is_active, date_of_birth, gender, blood_group, address, emergency_contact, specialization, license_number, hospital_name, experience_years, is_verified, access_level, created_at, updated_at) FROM stdin;
54b562e7-ac8b-47fd-b06f-1d690a5b22c7	Ahmed Khan	ahmed2@gmail.com	hash	patient	\N	03001234562	t	\N	male	\N	\N	\N	\N	\N	\N	\N	f	\N	2026-04-24 23:07:53.604064	2026-04-24 23:07:53.604064
194d097e-b430-4d5f-ae54-ca6ea35dd857	Usman Tariq	usman3@gmail.com	hash	patient	\N	03001234563	t	\N	male	\N	\N	\N	\N	\N	\N	\N	f	\N	2026-04-24 23:07:53.604064	2026-04-24 23:07:53.604064
09f99c55-20e8-4e86-a7ba-01f655e26a6a	Saad Ahmed	saad6@gmail.com	hash	patient	\N	03001234566	t	\N	male	\N	\N	\N	\N	\N	\N	\N	f	\N	2026-04-24 23:07:53.604064	2026-04-24 23:07:53.604064
87a8d557-d37a-4ade-bc34-978ef2c4a322	Ayesha Khan	ayesha7@gmail.com	hash	patient	\N	03001234567	t	\N	female	\N	\N	\N	\N	\N	\N	\N	f	\N	2026-04-24 23:07:53.604064	2026-04-24 23:07:53.604064
0cfb955b-5284-4ed0-bbcc-2f29085cf65e	Fatima Noor	fatima8@gmail.com	hash	patient	\N	03001234568	t	\N	female	\N	\N	\N	\N	\N	\N	\N	f	\N	2026-04-24 23:07:53.604064	2026-04-24 23:07:53.604064
20a16369-e2ab-403e-a650-e1bd3fd0090a	Hamza Shah	hamza10@gmail.com	hash	patient	\N	03001234570	t	\N	male	\N	\N	\N	\N	\N	\N	\N	f	\N	2026-04-24 23:07:53.604064	2026-04-24 23:07:53.604064
2a5a1644-9799-4f9f-8d7d-3efe49e07dbc	Sara Malik	sara13@gmail.com	hash	patient	\N	03001234573	t	\N	female	\N	\N	\N	\N	\N	\N	\N	f	\N	2026-04-24 23:07:53.604064	2026-04-24 23:07:53.604064
908990f4-84a5-4e87-879c-294bc339b9a9	Hina Butt	hina14@gmail.com	hash	patient	\N	03001234574	t	\N	female	\N	\N	\N	\N	\N	\N	\N	f	\N	2026-04-24 23:07:53.604064	2026-04-24 23:07:53.604064
70edd123-38bc-4816-a27d-988d33612e6f	Omar Farooq	omar15@gmail.com	hash	patient	\N	03001234575	t	\N	male	\N	\N	\N	\N	\N	\N	\N	f	\N	2026-04-24 23:07:53.604064	2026-04-24 23:07:53.604064
def4be95-88f1-4bfe-819e-5443b6cec18d	Laiba Zafar	laiba17@gmail.com	hash	patient	\N	03001234577	t	\N	female	\N	\N	\N	\N	\N	\N	\N	f	\N	2026-04-24 23:07:53.604064	2026-04-24 23:07:53.604064
046468d7-29c0-4232-bab7-57f82be30862	Daniyal Khan	daniyal18@gmail.com	hash	patient	\N	03001234578	t	\N	male	\N	\N	\N	\N	\N	\N	\N	f	\N	2026-04-24 23:07:53.604064	2026-04-24 23:07:53.604064
ac64cee1-c3cb-4ec0-a2fc-beafee9bac8d	Maham Ali	maham20@gmail.com	hash	patient	\N	03001234580	t	\N	female	\N	\N	\N	\N	\N	\N	\N	f	\N	2026-04-24 23:07:53.604064	2026-04-24 23:07:53.604064
42b4b367-4809-4139-9a93-464a09ab1c4f	Test Secure User	securetest@example.com	$2b$10$Dv5RM4z8Mqm3JzRCedNyNuwoXkpHumHGbBMrC0OguMemdBnnoRCOK	patient	\N	03009998888	t	\N	other	\N	\N	\N	\N	\N	\N	\N	f	\N	2026-04-28 14:42:53.889713	2026-04-28 14:42:53.889713
68ff5cca-f21c-4021-a8ca-713528941e0e	Ahmed Ali	ahmed@gmail.com	$2b$12$wV05l0vqDUmaY.GAfswgoukJqQpFYZRgSqj2g2j9LvhYd4WZNSrc2	patient	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	2026-05-06 00:20:45.879406	2026-05-06 00:20:45.879406
82a6229e-5240-4a0c-a823-d75bae7c1705	qwer	qwer@gmail.com	$2b$12$PQqqnZIBCGC7HqfKG1hPRuBJvwo5PDK3BfJMQgAp3wlV3AWHrX61C	patient	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	2026-05-06 00:25:11.582302	2026-05-06 00:25:11.582302
02103c24-7884-4396-b29e-059b573e2232	AHMED	zxcv@gmail.com	$2b$12$O57mytOGzaAk35/tzWOMLeHktkZji8C8RQvkQPYhz6swJh/V.XiP2	patient	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	2026-05-06 00:49:54.917235	2026-05-06 00:49:54.917235
c2eeabe0-8eb7-409b-b516-14d5c9baf425	ABCD	ABCD@GMAIL.COM	$2b$12$IR8US3BWsNtpl6xBUhJxb.YkKOjpDOzpnbmTaNejWHQ9Mf9g.J9FG	patient	\N	03212343123	t	4231-04-24	male	B+	SADAHSDJAHKJSDHKJASD	054342341321	\N	\N	\N	\N	f	\N	2026-05-07 17:04:22.874801	2026-05-07 17:04:22.874801
a2371b3a-284b-4f63-9255-cbeac57208d6	Admin123	admin@gmail.com	$2b$12$oLd/0E8k1e88.2HjvHAX.OPkjmpNF52x4139tydcZ3WCri8bBb5Ua	admin	\N	534212121	t	\N	male	\N	\N	\N	\N	\N	\N	\N	t	super_admin	2026-05-07 23:36:15.375234	2026-05-07 23:36:15.375234
e8faf053-fc7b-4cd4-8cfe-bffe7d95d30a	consultant123	consultant@gmail.com	$2b$12$kTh5uqAsl6AWB3bEL7UbnuK5GgU2VF.Z37o074SQEeoir4Bp//7rq	consultant	\N	2123123123123	t	\N	male	\N	\N	\N	\N	\N	\N	\N	t	\N	2026-05-07 23:37:22.843893	2026-05-07 23:37:22.843893
c2987363-8e64-4dc2-84fd-1260b0b3bad6	Ahmed Ali	ahmedalianjum28@gmail.com	$2b$12$skKvlJPHz0aD6d9R3Th5mehg4F9RBjWj7QXTG7Hnimr6rAS0FO97C	patient	\N	03004706900	t	2005-04-28	male	B+	239-G, LDA Avenue One	03234706900	\N	\N	\N	\N	t	\N	2026-05-16 13:07:30.237659	2026-05-16 13:07:30.237659
00177a15-c918-4534-96ba-c30657bf00b2	Patient Test	patient_test@example.com	$2b$12$kHwht3hKmb6Ju15dfaxvEeXjp3fozlVW/udyjTx8RuqQBKspTNenS	patient	\N	+1234567890	t	1990-01-01	male	A+	Test Address	+1987654321	\N	\N	\N	\N	f	\N	2026-05-17 11:44:21.499639	2026-05-17 11:44:21.499639
e5acd622-2706-4a0d-8583-1870a1e82861	Pasc	patient@gmail.com	$2b$12$p4UBQzU6RP/CK4ZxViSHeOvZXwOY3PrSq8zdGhpfMEOhWdqbqeliy	patient	\N	317327163721	t	2026-05-20	male	B+	sadasdasd	3213213123	\N	\N	\N	\N	f	\N	2026-05-10 12:52:41.024524	2026-05-10 12:52:41.024524
3c002a1c-f6f1-439b-afde-c423ed3ef6b0	Dr. Cardiology Specialist	cardiology@example.com	$2b$10$ygPizFq63QDulyf4vyy1tO4OoSTYV7IJozjKIIFpy9UDNzH22dphi	doctor	\N	555-000-0000	t	\N	other	\N	\N	\N	Cardiology	LIC-CAR-123	Central General Hospital	10	t	\N	2026-05-17 13:14:07.002609	2026-05-17 13:14:07.002609
b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	Isfa	isfa@gmail.com	$2b$12$NY/3DRNNuXmlYG5BG5QjXOmzLAKD7vrXHl.bvy4m0fFCSX7CTnlMe	patient	\N	345678	t	2026-05-14	female	A+	3123132131	3213123123	\N	\N	\N	\N	f	\N	2026-05-14 23:41:36.878696	2026-05-14 23:41:36.878696
3b52f039-5e43-4858-92a0-f4d1019bab83	Hassan Ali	hassan4@gmail.com	hash	doctor	\N	03001234564	t	\N	male	\N	\N	\N	Cardiology	\N	\N	\N	f	\N	2026-04-24 23:07:53.604064	2026-04-24 23:07:53.604064
8838004a-9915-4fe6-8d9b-69b126ba22b0	Muhammad Bilal	bilal5@gmail.com	hash	doctor	\N	03001234565	t	\N	male	\N	\N	\N	Neurology	\N	\N	\N	f	\N	2026-04-24 23:07:53.604064	2026-04-24 23:07:53.604064
aa4a604a-6260-4568-a7be-afef4fcdcc83	Zain Ali	zain9@gmail.com	hash	doctor	\N	03001234569	t	\N	male	\N	\N	\N	Orthopedics	\N	\N	\N	f	\N	2026-04-24 23:07:53.604064	2026-04-24 23:07:53.604064
6a9e8b60-5ce7-4965-b726-c3e1335ae80b	Dr. Imran Haider	imran11@gmail.com	hash	doctor	\N	03001234571	t	\N	male	\N	\N	\N	General Medicine	\N	\N	\N	f	\N	2026-04-24 23:07:53.604064	2026-04-24 23:07:53.604064
31adc1f3-7294-48a4-bbae-158c72795028	Dr. Naveed Iqbal	naveed12@gmail.com	hash	doctor	\N	03001234572	t	\N	male	\N	\N	\N	Pediatrics	\N	\N	\N	f	\N	2026-04-24 23:07:53.604064	2026-04-24 23:07:53.604064
614b9904-f1c8-4f79-969a-b3af41f8002a	Dr. Asad Mehmood	asad16@gmail.com	hash	doctor	\N	03001234576	t	\N	male	\N	\N	\N	Dermatology	\N	\N	\N	f	\N	2026-04-24 23:07:53.604064	2026-04-24 23:07:53.604064
7087e403-8596-4873-a4d7-6d259467701b	Dr. Salman Raza	salman19@gmail.com	hash	doctor	\N	03001234579	t	\N	male	\N	\N	\N	Surgery	\N	\N	\N	f	\N	2026-04-24 23:07:53.604064	2026-04-24 23:07:53.604064
f01f4078-297c-4f88-bf05-7981eba6b201	QWER	QWER@GMAIL.COM	$2b$12$mJcmjLsTfuQkEvc3gNj0suGBX/lsnA2W/EcUCUV20RwTvaawBmghO	doctor	\N	0321321321	t	\N	male	\N	\N	\N	Cardiology	32131321321	sfafsnakjsndkja	21	f	\N	2026-05-07 17:09:30.741207	2026-05-07 17:09:30.741207
d3db58b5-44b1-4b76-b335-99ffbabc71a4	Ahmed Ali	ASDF@gmail.com	$2b$12$/r1qenlapwGeFu0z8s9zG.dKlT6UmhswK64AKFvRdt8w365EcBJxa	doctor	\N	\N	t	\N	\N	\N	\N	\N	General Medicine	\N	\N	\N	t	\N	2026-05-06 00:21:43.561389	2026-05-08 00:26:28.993229
fe0fc54c-bf29-4430-852c-7f7cbfb17e85	ZXCV	ZXCV@gmail.com	$2b$12$0c0PLGtLoQwP2dYmwWY4te7Buko3lkblBBQw3769.7UJgcK1rG1Y6	doctor	\N	1212121212	t	\N	male	\N	\N	\N	Neurology	dsadsaasads	dsadsada	12	t	\N	2026-05-10 11:56:12.349182	2026-05-10 11:56:50.565528
b8917423-7373-4a1a-9075-2046014dd364	hello	hello@gmail.com	$2b$12$7Lepo/xBjG7.wEhDZFDtM.QkykYBYm0ZMBhAeEDVQYDXEs7g17h96	doctor	\N	321312312	t	\N	male	\N	\N	\N	Pediatrics	3213123	2132313	3213123	f	\N	2026-05-10 13:25:05.520538	2026-05-10 13:25:05.520538
cd53fc5a-4f5d-4b13-82cd-e248112da772	Doc Ali	doctor@gmail.com	$2b$12$gTMtaZuZZAFAFdyY/aAfmOLDshBwTurliTm8JSIhXvy1fk093yfK6	doctor	\N	12345678	t	\N	male	\N	\N	\N	Surgery	323452352	dasdadsa	12	t	\N	2026-05-14 16:13:53.815347	2026-05-14 16:14:27.384852
4a790890-5573-463a-aaf2-a2d32eefd04a	Dr Isfa	drisfa@gmail.com	$2b$12$sYtHRbWjrNO.61wCcEnGXOf51AyTwTxhdCR1BXVTs4TcE3OV78qIG	doctor	\N	2345678	t	\N	female	\N	\N	\N	Diabetes	L1231131	Hospital	40	t	\N	2026-05-14 23:57:35.818615	2026-05-14 23:58:07.612664
1375627f-98f3-47d0-9e68-3e92b69cf5f3	Ahmed Ali	ahmedalianjum2005@gmail.com	$2b$12$Adc/25yVYOmoV0EKLkBlH.p.O7kpKG1ia9iGcPG/3BXnWFmkNEaK6	doctor	\N	03234706900	t	\N	male	\N	\N	\N	Neurology	L7562321	Evercare	12	t	\N	2026-05-16 13:02:57.639412	2026-05-16 13:03:17.71096
6520da41-1636-43bb-aab4-756deb53912c	Dr. Dermatology Specialist	dermatology@example.com	$2b$10$ygPizFq63QDulyf4vyy1tO4OoSTYV7IJozjKIIFpy9UDNzH22dphi	doctor	\N	555-000-0000	t	\N	other	\N	\N	\N	Dermatology	LIC-DER-123	Central General Hospital	10	t	\N	2026-05-17 13:14:07.058893	2026-05-17 13:14:07.058893
0719136b-212d-4327-9439-6a0401cebeed	Dr. Neurology Specialist	neurology@example.com	$2b$10$ygPizFq63QDulyf4vyy1tO4OoSTYV7IJozjKIIFpy9UDNzH22dphi	doctor	\N	555-000-0000	t	\N	other	\N	\N	\N	Neurology	LIC-NEU-123	Central General Hospital	10	t	\N	2026-05-17 13:14:07.062072	2026-05-17 13:14:07.062072
00cd1773-fb74-4d26-a0f0-9eb160bf3d74	Dr. Pediatrics Specialist	pediatrics@example.com	$2b$10$ygPizFq63QDulyf4vyy1tO4OoSTYV7IJozjKIIFpy9UDNzH22dphi	doctor	\N	555-000-0000	t	\N	other	\N	\N	\N	Pediatrics	LIC-PED-123	Central General Hospital	10	t	\N	2026-05-17 13:14:07.06639	2026-05-17 13:14:07.06639
9613a42d-614e-40a7-aca3-8205568fd861	Dr. Orthopedics Specialist	orthopedics@example.com	$2b$10$ygPizFq63QDulyf4vyy1tO4OoSTYV7IJozjKIIFpy9UDNzH22dphi	doctor	\N	555-000-0000	t	\N	other	\N	\N	\N	Orthopedics	LIC-ORT-123	Central General Hospital	10	t	\N	2026-05-17 13:14:07.070338	2026-05-17 13:14:07.070338
e09488b9-281b-402a-9ff6-ac1ce7c4a7fd	Dr. General Medicine Specialist	general_medicine@example.com	$2b$10$ygPizFq63QDulyf4vyy1tO4OoSTYV7IJozjKIIFpy9UDNzH22dphi	doctor	\N	555-000-0000	t	\N	other	\N	\N	\N	General Medicine	LIC-GEN-123	Central General Hospital	10	t	\N	2026-05-17 13:14:07.075999	2026-05-17 13:14:07.075999
cfeeb922-324c-4ad1-b482-9cacddf05754	Dr. Psychiatry Specialist	psychiatry@example.com	$2b$10$ygPizFq63QDulyf4vyy1tO4OoSTYV7IJozjKIIFpy9UDNzH22dphi	doctor	\N	555-000-0000	t	\N	other	\N	\N	\N	Psychiatry	LIC-PSY-123	Central General Hospital	10	t	\N	2026-05-17 13:14:07.08039	2026-05-17 13:14:07.08039
f61f9d94-0739-4039-97fe-5bb9e777ba73	Dr. Gynecology Specialist	gynecology@example.com	$2b$10$ygPizFq63QDulyf4vyy1tO4OoSTYV7IJozjKIIFpy9UDNzH22dphi	doctor	\N	555-000-0000	t	\N	other	\N	\N	\N	Gynecology	LIC-GYN-123	Central General Hospital	10	t	\N	2026-05-17 13:14:07.094227	2026-05-17 13:14:07.094227
9ee0498c-0f8e-4f54-a839-f1e092366a7c	fatimaisfa	fatimaisfa@gmail.com	$2b$12$XIdTjP9uDVcPo.qGCnzlluXFg6tkR.3xFj6NI5JLeYsZ2Yr8KT/aG	doctor	\N	3456789	t	\N	female	\N	\N	\N	Cardiology	l342423	asdfasdfa	12	t	\N	2026-05-17 13:28:53.441102	2026-05-17 13:29:12.753488
8713248d-073f-4ec7-949f-83ce0d2affb3	Ishmal	ishmal@gmail.com	$2b$12$Cs9VCg9OlPnDuCdu3X6C/uPJKkxlGVvbBurDx1pol6iaUGDPgDUHy	doctor	\N	023189473982	t	\N	female	\N	\N	\N	Dermatologist	l1232132	General Hospital	12	t	\N	2026-05-17 16:27:02.91959	2026-05-17 16:27:26.380615
4c6b05e9-7960-4282-a5f3-23b5f587448b	Ahmed Ali	isfafatima4@gmail.com	$2b$12$.BHdxy4vdltUWCYbJanJJ.AZJB/IhdI.o5vLBqXwU6paru/tQXRcq	patient	\N	23456	t	2026-05-19	female	A+	239-G, LDA Avenue One	134567	\N	\N	\N	\N	f	\N	2026-05-18 15:43:51.642118	2026-05-18 15:43:51.642118
997621a6-b110-4f5e-bb09-573223cbcf39	isfah	fatimaisfa55@gmail.com	$2b$12$pm9atxnbvwfZl9f6QEvI5O0wu/p/1aeRQVsPllLA2E5BqlWCxnWeG	patient	\N	09987544	t	2006-06-13	female	A+	fsghggsb	456799	\N	\N	\N	\N	f	\N	2026-05-18 15:48:49.3762	2026-05-18 15:48:49.3762
13cb1bb5-915f-4a60-88d4-8968d3b4616b	Ahmed Ali	244403212@formanite.fccollege.edu.pk	$2b$12$abacUnp8P4vYINLHOj192.43uieZCFw.Hq3sNScrZ3Zw4.Ikl1JLS	patient	\N	03234706900	t	2005-04-28	male	B+	239-G, LDA Avenue One	03004706900	\N	\N	\N	\N	t	\N	2026-05-18 16:51:17.624987	2026-05-18 16:51:17.624987
a3baae46-d10f-4c5e-9295-0f064f024ea9	doctor1	doc@doc.com	$2b$12$jboujMRaELYAp1i5z6bDu.861ZrhLIrvKWOpmqz1pLejMkyTrtbqS	doctor	\N	12312332	t	\N	male	\N	\N	\N	Orthopedics	32132132	fdses	21	t	\N	2026-05-10 13:23:16.002614	2026-05-18 17:07:20.148952
\.


--
-- TOC entry 5324 (class 0 OID 17152)
-- Dependencies: 228
-- Data for Name: vitals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vitals (vital_id, patient_user_id, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, glucose_level, oxygen_saturation, temperature, weight, logged_at) FROM stdin;
1f6f5d08-5a5f-4b73-8f60-c1d41432735d	2a5a1644-9799-4f9f-8d7d-3efe49e07dbc	110	70	85	\N	88	\N	\N	2026-04-28 15:29:23.868906
11c8c709-9628-4da7-8997-dca289c92491	54b562e7-ac8b-47fd-b06f-1d690a5b22c7	128	81	78	106.942657680418	98.4177671592098	36.3347103530061	63.840774362946	2026-04-28 16:16:19.867623
5360e968-2f29-49dc-bf0e-becbc1bf0c7e	194d097e-b430-4d5f-ae54-ca6ea35dd857	124	81	76	102.168938647574	97.3344440717469	36.3605339489851	73.9961010192555	2026-04-28 16:16:19.867623
93019213-7913-46a1-9fd4-833acf7662df	09f99c55-20e8-4e86-a7ba-01f655e26a6a	125	81	79	106.381933301188	98.7097396220916	37.4307725082763	72.987314097469	2026-04-28 16:16:19.867623
5cbb2607-8be0-43bb-aad9-8b4bcab74012	87a8d557-d37a-4ade-bc34-978ef2c4a322	121	84	73	101.268119898179	97.0292320354331	37.8645744525192	72.0749600666079	2026-04-28 16:16:19.867623
84060462-2167-4ad7-b2d7-ed8c6edab5ca	0cfb955b-5284-4ed0-bbcc-2f29085cf65e	126	82	74	116.047468598347	98.6796961378912	37.1162099698978	60.0344252709317	2026-04-28 16:16:19.867623
ed1a4554-3db6-4644-b93b-40d56303ae6c	20a16369-e2ab-403e-a650-e1bd3fd0090a	127	82	77	101.270221265994	96.4968846402066	37.3841979104476	71.262544300415	2026-04-28 16:16:19.867623
41ce3721-5fde-4831-876d-2c71319e0641	2a5a1644-9799-4f9f-8d7d-3efe49e07dbc	128	83	78	105.903914989831	96.5964648457894	36.0642022418868	68.4891912533463	2026-04-28 16:16:19.867623
e913e77c-526b-4ab5-8081-bedfa01d9cf9	908990f4-84a5-4e87-879c-294bc339b9a9	126	83	74	115.290126217882	98.1826880046487	36.0170122529633	71.3300046234498	2026-04-28 16:16:19.867623
28b3b462-6867-4672-afe7-08247c0a085b	70edd123-38bc-4816-a27d-988d33612e6f	130	84	73	114.711721301208	98.8339318807769	36.9825445266706	74.0891442991058	2026-04-28 16:16:19.867623
740c511e-3b45-484f-889b-b5db9c5932d7	def4be95-88f1-4bfe-819e-5443b6cec18d	126	85	79	114.368018153385	99.1885270681338	36.9363550003965	60.4283382488599	2026-04-28 16:16:19.867623
0262f2e6-02c6-4eae-ba55-d66c19a3952b	046468d7-29c0-4232-bab7-57f82be30862	129	81	71	110.028133674839	97.1386336848094	36.3188347726915	72.8391489521271	2026-04-28 16:16:19.867623
5cce1d0b-9ea1-4b1e-a183-e889ed37e9d4	ac64cee1-c3cb-4ec0-a2fc-beafee9bac8d	128	80	74	110.573920336713	99.1725192285298	37.354483285841	74.5635438168451	2026-04-28 16:16:19.867623
340e2678-c504-477b-afeb-bd98e4866006	42b4b367-4809-4139-9a93-464a09ab1c4f	125	84	75	107.238299658929	98.1918412170309	37.9257059026632	62.4259798456776	2026-04-28 16:16:19.867623
7dfdfdec-d55c-44e2-bb39-ab08b067f0a3	e5acd622-2706-4a0d-8583-1870a1e82861	500	6	800	380	99	36	58	2026-05-10 14:51:16.191164
eb73a84c-e1d3-4cf6-820d-01e017260c0e	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	180	50	100	500	100	36	58	2026-05-15 00:17:07.285957
ca3c88aa-b8f2-403c-92fe-9139a079d441	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	500	20	90	5000	\N	36	\N	2026-05-17 18:09:09.108905
bab3ef63-14f4-4c1e-9d5e-247911fb90f9	b6f5b1ab-2f47-4a20-ba5d-3bf429cb8e42	120	80	72	4999	\N	36	\N	2026-05-17 18:11:11.98469
46571062-416e-4429-8b57-ed26fa6a68ec	c2987363-8e64-4dc2-84fd-1260b0b3bad6	500	20	72	5000	\N	36	\N	2026-05-17 19:10:32.63599
\.


--
-- TOC entry 5350 (class 0 OID 0)
-- Dependencies: 242
-- Name: forum_post_likes_like_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.forum_post_likes_like_id_seq', 23, true);


--
-- TOC entry 5351 (class 0 OID 0)
-- Dependencies: 244
-- Name: medical_specializations_specialization_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.medical_specializations_specialization_id_seq', 90, true);


--
-- TOC entry 5079 (class 2606 OID 17179)
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (alert_id);


--
-- TOC entry 5052 (class 2606 OID 17058)
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (appointment_id);


--
-- TOC entry 5115 (class 2606 OID 17390)
-- Name: article_bookmarks article_bookmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.article_bookmarks
    ADD CONSTRAINT article_bookmarks_pkey PRIMARY KEY (bookmark_id);


--
-- TOC entry 5109 (class 2606 OID 17354)
-- Name: article_comments article_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.article_comments
    ADD CONSTRAINT article_comments_pkey PRIMARY KEY (comment_id);


--
-- TOC entry 5111 (class 2606 OID 17372)
-- Name: article_likes article_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.article_likes
    ADD CONSTRAINT article_likes_pkey PRIMARY KEY (like_id);


--
-- TOC entry 5107 (class 2606 OID 17338)
-- Name: blog_articles blog_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_articles
    ADD CONSTRAINT blog_articles_pkey PRIMARY KEY (article_id);


--
-- TOC entry 5089 (class 2606 OID 17254)
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (message_id);


--
-- TOC entry 5084 (class 2606 OID 17228)
-- Name: chat_rooms chat_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_pkey PRIMARY KEY (room_id);


--
-- TOC entry 5120 (class 2606 OID 17523)
-- Name: doctor_availability doctor_availability_doctor_user_id_day_of_week_start_time_e_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_availability
    ADD CONSTRAINT doctor_availability_doctor_user_id_day_of_week_start_time_e_key UNIQUE (doctor_user_id, day_of_week, start_time, end_time);


--
-- TOC entry 5122 (class 2606 OID 17521)
-- Name: doctor_availability doctor_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_availability
    ADD CONSTRAINT doctor_availability_pkey PRIMARY KEY (availability_id);


--
-- TOC entry 5126 (class 2606 OID 17584)
-- Name: forum_post_likes forum_post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_post_likes
    ADD CONSTRAINT forum_post_likes_pkey PRIMARY KEY (like_id);


--
-- TOC entry 5128 (class 2606 OID 17586)
-- Name: forum_post_likes forum_post_likes_post_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_post_likes
    ADD CONSTRAINT forum_post_likes_post_id_user_id_key UNIQUE (post_id, user_id);


--
-- TOC entry 5095 (class 2606 OID 17278)
-- Name: forum_posts forum_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_posts
    ADD CONSTRAINT forum_posts_pkey PRIMARY KEY (post_id);


--
-- TOC entry 5100 (class 2606 OID 17295)
-- Name: forum_replies forum_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_replies
    ADD CONSTRAINT forum_replies_pkey PRIMARY KEY (reply_id);


--
-- TOC entry 5104 (class 2606 OID 17316)
-- Name: forum_reports forum_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_reports
    ADD CONSTRAINT forum_reports_pkey PRIMARY KEY (report_id);


--
-- TOC entry 5082 (class 2606 OID 17200)
-- Name: medical_history medical_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_history
    ADD CONSTRAINT medical_history_pkey PRIMARY KEY (history_id);


--
-- TOC entry 5130 (class 2606 OID 17613)
-- Name: medical_specializations medical_specializations_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_specializations
    ADD CONSTRAINT medical_specializations_name_key UNIQUE (name);


--
-- TOC entry 5132 (class 2606 OID 17611)
-- Name: medical_specializations medical_specializations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_specializations
    ADD CONSTRAINT medical_specializations_pkey PRIMARY KEY (specialization_id);


--
-- TOC entry 5074 (class 2606 OID 17140)
-- Name: medication_logs medication_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medication_logs
    ADD CONSTRAINT medication_logs_pkey PRIMARY KEY (log_id);


--
-- TOC entry 5062 (class 2606 OID 17108)
-- Name: medications medications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medications
    ADD CONSTRAINT medications_pkey PRIMARY KEY (medication_id);


--
-- TOC entry 5118 (class 2606 OID 17411)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);


--
-- TOC entry 5067 (class 2606 OID 17116)
-- Name: patient_medications patient_medications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_medications
    ADD CONSTRAINT patient_medications_pkey PRIMARY KEY (patient_medication_id);


--
-- TOC entry 5059 (class 2606 OID 17081)
-- Name: prescriptions prescriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_pkey PRIMARY KEY (prescription_id);


--
-- TOC entry 5113 (class 2606 OID 17549)
-- Name: article_likes unique_user_article_like; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.article_likes
    ADD CONSTRAINT unique_user_article_like UNIQUE (article_id, user_id);


--
-- TOC entry 5048 (class 2606 OID 17041)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5050 (class 2606 OID 17039)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 5077 (class 2606 OID 17161)
-- Name: vitals vitals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vitals
    ADD CONSTRAINT vitals_pkey PRIMARY KEY (vital_id);


--
-- TOC entry 5080 (class 1259 OID 17190)
-- Name: idx_alerts_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alerts_patient ON public.alerts USING btree (patient_user_id);


--
-- TOC entry 5053 (class 1259 OID 17070)
-- Name: idx_appointments_doctor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_doctor ON public.appointments USING btree (doctor_user_id);


--
-- TOC entry 5054 (class 1259 OID 17069)
-- Name: idx_appointments_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_patient ON public.appointments USING btree (patient_user_id);


--
-- TOC entry 5055 (class 1259 OID 17071)
-- Name: idx_appointments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_status ON public.appointments USING btree (status);


--
-- TOC entry 5090 (class 1259 OID 17547)
-- Name: idx_chat_messages_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_messages_is_read ON public.chat_messages USING btree (is_read);


--
-- TOC entry 5091 (class 1259 OID 17545)
-- Name: idx_chat_messages_room; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_messages_room ON public.chat_messages USING btree (room_id);


--
-- TOC entry 5092 (class 1259 OID 17546)
-- Name: idx_chat_messages_sender; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_messages_sender ON public.chat_messages USING btree (sender_id);


--
-- TOC entry 5093 (class 1259 OID 17265)
-- Name: idx_chat_room; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_room ON public.chat_messages USING btree (room_id);


--
-- TOC entry 5085 (class 1259 OID 17544)
-- Name: idx_chat_rooms_consultant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_rooms_consultant ON public.chat_rooms USING btree (consultant_user_id);


--
-- TOC entry 5086 (class 1259 OID 17543)
-- Name: idx_chat_rooms_doctor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_rooms_doctor ON public.chat_rooms USING btree (doctor_user_id);


--
-- TOC entry 5087 (class 1259 OID 17542)
-- Name: idx_chat_rooms_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_rooms_patient ON public.chat_rooms USING btree (patient_user_id);


--
-- TOC entry 5123 (class 1259 OID 17530)
-- Name: idx_doctor_availability_day; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_doctor_availability_day ON public.doctor_availability USING btree (day_of_week);


--
-- TOC entry 5124 (class 1259 OID 17529)
-- Name: idx_doctor_availability_doctor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_doctor_availability_doctor ON public.doctor_availability USING btree (doctor_user_id);


--
-- TOC entry 5096 (class 1259 OID 17557)
-- Name: idx_forum_posts_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_forum_posts_created ON public.forum_posts USING btree (created_at);


--
-- TOC entry 5097 (class 1259 OID 17556)
-- Name: idx_forum_posts_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_forum_posts_status ON public.forum_posts USING btree (status);


--
-- TOC entry 5098 (class 1259 OID 17555)
-- Name: idx_forum_posts_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_forum_posts_user ON public.forum_posts USING btree (user_id);


--
-- TOC entry 5101 (class 1259 OID 17558)
-- Name: idx_forum_replies_post; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_forum_replies_post ON public.forum_replies USING btree (post_id);


--
-- TOC entry 5102 (class 1259 OID 17559)
-- Name: idx_forum_replies_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_forum_replies_user ON public.forum_replies USING btree (user_id);


--
-- TOC entry 5105 (class 1259 OID 17560)
-- Name: idx_forum_reports_post; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_forum_reports_post ON public.forum_reports USING btree (post_id);


--
-- TOC entry 5068 (class 1259 OID 17151)
-- Name: idx_med_logs_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_med_logs_patient ON public.medication_logs USING btree (patient_user_id);


--
-- TOC entry 5069 (class 1259 OID 17553)
-- Name: idx_medication_logs_medication; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_medication_logs_medication ON public.medication_logs USING btree (patient_medication_id);


--
-- TOC entry 5070 (class 1259 OID 17552)
-- Name: idx_medication_logs_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_medication_logs_patient ON public.medication_logs USING btree (patient_user_id);


--
-- TOC entry 5071 (class 1259 OID 17621)
-- Name: idx_medication_logs_patient_status_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_medication_logs_patient_status_time ON public.medication_logs USING btree (patient_user_id, status, scheduled_time);


--
-- TOC entry 5072 (class 1259 OID 17554)
-- Name: idx_medication_logs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_medication_logs_status ON public.medication_logs USING btree (status);


--
-- TOC entry 5060 (class 1259 OID 17109)
-- Name: idx_medications_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_medications_name ON public.medications USING btree (name);


--
-- TOC entry 5116 (class 1259 OID 17417)
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);


--
-- TOC entry 5063 (class 1259 OID 17551)
-- Name: idx_patient_medications_medication; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_patient_medications_medication ON public.patient_medications USING btree (medication_id);


--
-- TOC entry 5064 (class 1259 OID 17132)
-- Name: idx_patient_medications_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_patient_medications_patient ON public.patient_medications USING btree (patient_user_id);


--
-- TOC entry 5065 (class 1259 OID 17550)
-- Name: idx_patient_medications_prescription; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_patient_medications_prescription ON public.patient_medications USING btree (prescription_id);


--
-- TOC entry 5056 (class 1259 OID 17098)
-- Name: idx_prescriptions_doctor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prescriptions_doctor ON public.prescriptions USING btree (doctor_user_id);


--
-- TOC entry 5057 (class 1259 OID 17097)
-- Name: idx_prescriptions_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prescriptions_patient ON public.prescriptions USING btree (patient_user_id);


--
-- TOC entry 5045 (class 1259 OID 17042)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 5046 (class 1259 OID 17043)
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- TOC entry 5075 (class 1259 OID 17167)
-- Name: idx_vitals_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vitals_patient ON public.vitals USING btree (patient_user_id);


--
-- TOC entry 5144 (class 2606 OID 17180)
-- Name: alerts alerts_patient_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_patient_user_id_fkey FOREIGN KEY (patient_user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5145 (class 2606 OID 17185)
-- Name: alerts alerts_vital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_vital_id_fkey FOREIGN KEY (vital_id) REFERENCES public.vitals(vital_id) ON DELETE CASCADE;


--
-- TOC entry 5133 (class 2606 OID 17064)
-- Name: appointments appointments_doctor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_doctor_user_id_fkey FOREIGN KEY (doctor_user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5134 (class 2606 OID 17059)
-- Name: appointments appointments_patient_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_user_id_fkey FOREIGN KEY (patient_user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5165 (class 2606 OID 17391)
-- Name: article_bookmarks article_bookmarks_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.article_bookmarks
    ADD CONSTRAINT article_bookmarks_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.blog_articles(article_id) ON DELETE CASCADE;


--
-- TOC entry 5166 (class 2606 OID 17396)
-- Name: article_bookmarks article_bookmarks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.article_bookmarks
    ADD CONSTRAINT article_bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5161 (class 2606 OID 17355)
-- Name: article_comments article_comments_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.article_comments
    ADD CONSTRAINT article_comments_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.blog_articles(article_id) ON DELETE CASCADE;


--
-- TOC entry 5162 (class 2606 OID 17360)
-- Name: article_comments article_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.article_comments
    ADD CONSTRAINT article_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5163 (class 2606 OID 17373)
-- Name: article_likes article_likes_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.article_likes
    ADD CONSTRAINT article_likes_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.blog_articles(article_id) ON DELETE CASCADE;


--
-- TOC entry 5164 (class 2606 OID 17378)
-- Name: article_likes article_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.article_likes
    ADD CONSTRAINT article_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5160 (class 2606 OID 17339)
-- Name: blog_articles blog_articles_author_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_articles
    ADD CONSTRAINT blog_articles_author_user_id_fkey FOREIGN KEY (author_user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5153 (class 2606 OID 17255)
-- Name: chat_messages chat_messages_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.chat_rooms(room_id) ON DELETE CASCADE;


--
-- TOC entry 5154 (class 2606 OID 17260)
-- Name: chat_messages chat_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5150 (class 2606 OID 17239)
-- Name: chat_rooms chat_rooms_consultant_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_consultant_user_id_fkey FOREIGN KEY (consultant_user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5151 (class 2606 OID 17234)
-- Name: chat_rooms chat_rooms_doctor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_doctor_user_id_fkey FOREIGN KEY (doctor_user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5152 (class 2606 OID 17229)
-- Name: chat_rooms chat_rooms_patient_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_patient_user_id_fkey FOREIGN KEY (patient_user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5168 (class 2606 OID 17524)
-- Name: doctor_availability doctor_availability_doctor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_availability
    ADD CONSTRAINT doctor_availability_doctor_user_id_fkey FOREIGN KEY (doctor_user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5169 (class 2606 OID 17587)
-- Name: forum_post_likes forum_post_likes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_post_likes
    ADD CONSTRAINT forum_post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.forum_posts(post_id) ON DELETE CASCADE;


--
-- TOC entry 5170 (class 2606 OID 17592)
-- Name: forum_post_likes forum_post_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_post_likes
    ADD CONSTRAINT forum_post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5155 (class 2606 OID 17279)
-- Name: forum_posts forum_posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_posts
    ADD CONSTRAINT forum_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5156 (class 2606 OID 17296)
-- Name: forum_replies forum_replies_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_replies
    ADD CONSTRAINT forum_replies_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.forum_posts(post_id) ON DELETE CASCADE;


--
-- TOC entry 5157 (class 2606 OID 17301)
-- Name: forum_replies forum_replies_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_replies
    ADD CONSTRAINT forum_replies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5158 (class 2606 OID 17317)
-- Name: forum_reports forum_reports_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_reports
    ADD CONSTRAINT forum_reports_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.forum_posts(post_id) ON DELETE CASCADE;


--
-- TOC entry 5159 (class 2606 OID 17322)
-- Name: forum_reports forum_reports_reported_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_reports
    ADD CONSTRAINT forum_reports_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5146 (class 2606 OID 17216)
-- Name: medical_history medical_history_added_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_history
    ADD CONSTRAINT medical_history_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5147 (class 2606 OID 17201)
-- Name: medical_history medical_history_patient_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_history
    ADD CONSTRAINT medical_history_patient_user_id_fkey FOREIGN KEY (patient_user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5148 (class 2606 OID 17211)
-- Name: medical_history medical_history_related_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_history
    ADD CONSTRAINT medical_history_related_appointment_id_fkey FOREIGN KEY (related_appointment_id) REFERENCES public.appointments(appointment_id) ON DELETE SET NULL;


--
-- TOC entry 5149 (class 2606 OID 17206)
-- Name: medical_history medical_history_related_prescription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_history
    ADD CONSTRAINT medical_history_related_prescription_id_fkey FOREIGN KEY (related_prescription_id) REFERENCES public.prescriptions(prescription_id) ON DELETE SET NULL;


--
-- TOC entry 5141 (class 2606 OID 17141)
-- Name: medication_logs medication_logs_patient_medication_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medication_logs
    ADD CONSTRAINT medication_logs_patient_medication_id_fkey FOREIGN KEY (patient_medication_id) REFERENCES public.patient_medications(patient_medication_id) ON DELETE CASCADE;


--
-- TOC entry 5142 (class 2606 OID 17146)
-- Name: medication_logs medication_logs_patient_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medication_logs
    ADD CONSTRAINT medication_logs_patient_user_id_fkey FOREIGN KEY (patient_user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5167 (class 2606 OID 17412)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5138 (class 2606 OID 17127)
-- Name: patient_medications patient_medications_medication_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_medications
    ADD CONSTRAINT patient_medications_medication_id_fkey FOREIGN KEY (medication_id) REFERENCES public.medications(medication_id) ON DELETE CASCADE;


--
-- TOC entry 5139 (class 2606 OID 17122)
-- Name: patient_medications patient_medications_patient_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_medications
    ADD CONSTRAINT patient_medications_patient_user_id_fkey FOREIGN KEY (patient_user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5140 (class 2606 OID 17117)
-- Name: patient_medications patient_medications_prescription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_medications
    ADD CONSTRAINT patient_medications_prescription_id_fkey FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(prescription_id) ON DELETE CASCADE;


--
-- TOC entry 5135 (class 2606 OID 17092)
-- Name: prescriptions prescriptions_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(appointment_id) ON DELETE SET NULL;


--
-- TOC entry 5136 (class 2606 OID 17087)
-- Name: prescriptions prescriptions_doctor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_doctor_user_id_fkey FOREIGN KEY (doctor_user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5137 (class 2606 OID 17082)
-- Name: prescriptions prescriptions_patient_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_patient_user_id_fkey FOREIGN KEY (patient_user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5143 (class 2606 OID 17162)
-- Name: vitals vitals_patient_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vitals
    ADD CONSTRAINT vitals_patient_user_id_fkey FOREIGN KEY (patient_user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


-- Completed on 2026-05-29 13:50:56

--
-- PostgreSQL database dump complete
--

\unrestrict 0Dm7iiVZGeuUCjJhbdVVRdtdAfnvq8PiHTxsfct9DRrDp36rGRONFQijhMr0Z1J

