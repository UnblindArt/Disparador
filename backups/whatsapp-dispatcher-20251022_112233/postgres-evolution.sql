--
-- PostgreSQL database dump
--

\restrict OcVvdin08saMuhOLGrpcJdpXMHUs6bBFndfTPvRfZ3dcmSW4mhV7DRmyILDlf1z

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

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
-- Name: DeviceMessage; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DeviceMessage" AS ENUM (
    'ios',
    'android',
    'web',
    'unknown',
    'desktop'
);


ALTER TYPE public."DeviceMessage" OWNER TO postgres;

--
-- Name: DifyBotType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DifyBotType" AS ENUM (
    'chatBot',
    'textGenerator',
    'agent',
    'workflow'
);


ALTER TYPE public."DifyBotType" OWNER TO postgres;

--
-- Name: InstanceConnectionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."InstanceConnectionStatus" AS ENUM (
    'open',
    'close',
    'connecting'
);


ALTER TYPE public."InstanceConnectionStatus" OWNER TO postgres;

--
-- Name: OpenaiBotType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OpenaiBotType" AS ENUM (
    'assistant',
    'chatCompletion'
);


ALTER TYPE public."OpenaiBotType" OWNER TO postgres;

--
-- Name: SessionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SessionStatus" AS ENUM (
    'opened',
    'closed',
    'paused'
);


ALTER TYPE public."SessionStatus" OWNER TO postgres;

--
-- Name: TriggerOperator; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TriggerOperator" AS ENUM (
    'contains',
    'equals',
    'startsWith',
    'endsWith',
    'regex'
);


ALTER TYPE public."TriggerOperator" OWNER TO postgres;

--
-- Name: TriggerType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TriggerType" AS ENUM (
    'all',
    'keyword',
    'none',
    'advanced'
);


ALTER TYPE public."TriggerType" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Chat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Chat" (
    id text NOT NULL,
    "remoteJid" character varying(100) NOT NULL,
    labels jsonb,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone,
    "instanceId" text NOT NULL,
    name character varying(100),
    "unreadMessages" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Chat" OWNER TO postgres;

--
-- Name: Chatwoot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Chatwoot" (
    id text NOT NULL,
    enabled boolean DEFAULT true,
    "accountId" character varying(100),
    token character varying(100),
    url character varying(500),
    "nameInbox" character varying(100),
    "signMsg" boolean DEFAULT false,
    "signDelimiter" character varying(100),
    number character varying(100),
    "reopenConversation" boolean DEFAULT false,
    "conversationPending" boolean DEFAULT false,
    "mergeBrazilContacts" boolean DEFAULT false,
    "importContacts" boolean DEFAULT false,
    "importMessages" boolean DEFAULT false,
    "daysLimitImportMessages" integer,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    logo character varying(500),
    organization character varying(100),
    "ignoreJids" jsonb
);


ALTER TABLE public."Chatwoot" OWNER TO postgres;

--
-- Name: Contact; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Contact" (
    id text NOT NULL,
    "remoteJid" character varying(100) NOT NULL,
    "pushName" character varying(100),
    "profilePicUrl" character varying(500),
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone,
    "instanceId" text NOT NULL
);


ALTER TABLE public."Contact" OWNER TO postgres;

--
-- Name: Dify; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Dify" (
    id text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "botType" public."DifyBotType" NOT NULL,
    "apiUrl" character varying(255),
    "apiKey" character varying(255),
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "triggerType" public."TriggerType",
    "triggerOperator" public."TriggerOperator",
    "triggerValue" text,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    description character varying(255),
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50
);


ALTER TABLE public."Dify" OWNER TO postgres;

--
-- Name: DifySetting; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DifySetting" (
    id text NOT NULL,
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "difyIdFallback" character varying(100),
    "instanceId" text NOT NULL,
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50
);


ALTER TABLE public."DifySetting" OWNER TO postgres;

--
-- Name: EvolutionBot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."EvolutionBot" (
    id text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    description character varying(255),
    "apiUrl" character varying(255),
    "apiKey" character varying(255),
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "triggerType" public."TriggerType",
    "triggerOperator" public."TriggerOperator",
    "triggerValue" text,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50
);


ALTER TABLE public."EvolutionBot" OWNER TO postgres;

--
-- Name: EvolutionBotSetting; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."EvolutionBotSetting" (
    id text NOT NULL,
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "botIdFallback" character varying(100),
    "instanceId" text NOT NULL,
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50
);


ALTER TABLE public."EvolutionBotSetting" OWNER TO postgres;

--
-- Name: Flowise; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Flowise" (
    id text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    description character varying(255),
    "apiUrl" character varying(255),
    "apiKey" character varying(255),
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "triggerType" public."TriggerType",
    "triggerOperator" public."TriggerOperator",
    "triggerValue" text,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50
);


ALTER TABLE public."Flowise" OWNER TO postgres;

--
-- Name: FlowiseSetting; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FlowiseSetting" (
    id text NOT NULL,
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "flowiseIdFallback" character varying(100),
    "instanceId" text NOT NULL,
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50
);


ALTER TABLE public."FlowiseSetting" OWNER TO postgres;

--
-- Name: Instance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Instance" (
    id text NOT NULL,
    name character varying(255) NOT NULL,
    "connectionStatus" public."InstanceConnectionStatus" DEFAULT 'open'::public."InstanceConnectionStatus" NOT NULL,
    "ownerJid" character varying(100),
    "profilePicUrl" character varying(500),
    integration character varying(100),
    number character varying(100),
    token character varying(255),
    "clientName" character varying(100),
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone,
    "profileName" character varying(100),
    "businessId" character varying(100),
    "disconnectionAt" timestamp without time zone,
    "disconnectionObject" jsonb,
    "disconnectionReasonCode" integer
);


ALTER TABLE public."Instance" OWNER TO postgres;

--
-- Name: IntegrationSession; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."IntegrationSession" (
    id text NOT NULL,
    "sessionId" character varying(255) NOT NULL,
    "remoteJid" character varying(100) NOT NULL,
    "pushName" text,
    status public."SessionStatus" NOT NULL,
    "awaitUser" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    parameters jsonb,
    context jsonb,
    "botId" text,
    type character varying(100)
);


ALTER TABLE public."IntegrationSession" OWNER TO postgres;

--
-- Name: IsOnWhatsapp; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."IsOnWhatsapp" (
    id text NOT NULL,
    "remoteJid" character varying(100) NOT NULL,
    "jidOptions" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL
);


ALTER TABLE public."IsOnWhatsapp" OWNER TO postgres;

--
-- Name: Label; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Label" (
    id text NOT NULL,
    "labelId" character varying(100),
    name character varying(100) NOT NULL,
    color character varying(100) NOT NULL,
    "predefinedId" character varying(100),
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE public."Label" OWNER TO postgres;

--
-- Name: Media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Media" (
    id text NOT NULL,
    "fileName" character varying(500) NOT NULL,
    type character varying(100) NOT NULL,
    mimetype character varying(100) NOT NULL,
    "createdAt" date DEFAULT CURRENT_TIMESTAMP,
    "messageId" text NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE public."Media" OWNER TO postgres;

--
-- Name: Message; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    key jsonb NOT NULL,
    "pushName" character varying(100),
    participant character varying(100),
    "messageType" character varying(100) NOT NULL,
    message jsonb NOT NULL,
    "contextInfo" jsonb,
    source public."DeviceMessage" NOT NULL,
    "messageTimestamp" integer NOT NULL,
    "chatwootMessageId" integer,
    "chatwootInboxId" integer,
    "chatwootConversationId" integer,
    "chatwootContactInboxSourceId" character varying(100),
    "chatwootIsRead" boolean,
    "instanceId" text NOT NULL,
    "webhookUrl" character varying(500),
    "sessionId" text,
    status character varying(30)
);


ALTER TABLE public."Message" OWNER TO postgres;

--
-- Name: MessageUpdate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MessageUpdate" (
    id text NOT NULL,
    "keyId" character varying(100) NOT NULL,
    "remoteJid" character varying(100) NOT NULL,
    "fromMe" boolean NOT NULL,
    participant character varying(100),
    "pollUpdates" jsonb,
    status character varying(30) NOT NULL,
    "messageId" text NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE public."MessageUpdate" OWNER TO postgres;

--
-- Name: OpenaiBot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OpenaiBot" (
    id text NOT NULL,
    "assistantId" character varying(255),
    model character varying(100),
    "systemMessages" jsonb,
    "assistantMessages" jsonb,
    "userMessages" jsonb,
    "maxTokens" integer,
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "triggerType" public."TriggerType",
    "triggerOperator" public."TriggerOperator",
    "triggerValue" text,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "openaiCredsId" text NOT NULL,
    "instanceId" text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "botType" public."OpenaiBotType" NOT NULL,
    description character varying(255),
    "functionUrl" character varying(500),
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50
);


ALTER TABLE public."OpenaiBot" OWNER TO postgres;

--
-- Name: OpenaiCreds; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OpenaiCreds" (
    id text NOT NULL,
    "apiKey" character varying(255),
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    name character varying(255)
);


ALTER TABLE public."OpenaiCreds" OWNER TO postgres;

--
-- Name: OpenaiSetting; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OpenaiSetting" (
    id text NOT NULL,
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "openaiCredsId" text NOT NULL,
    "openaiIdFallback" character varying(100),
    "instanceId" text NOT NULL,
    "speechToText" boolean DEFAULT false,
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50
);


ALTER TABLE public."OpenaiSetting" OWNER TO postgres;

--
-- Name: Proxy; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Proxy" (
    id text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    host character varying(100) NOT NULL,
    port character varying(100) NOT NULL,
    protocol character varying(100) NOT NULL,
    username character varying(100) NOT NULL,
    password character varying(100) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE public."Proxy" OWNER TO postgres;

--
-- Name: Pusher; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Pusher" (
    id text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    "appId" character varying(100) NOT NULL,
    key character varying(100) NOT NULL,
    secret character varying(100) NOT NULL,
    cluster character varying(100) NOT NULL,
    "useTLS" boolean DEFAULT false NOT NULL,
    events jsonb NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE public."Pusher" OWNER TO postgres;

--
-- Name: Rabbitmq; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Rabbitmq" (
    id text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    events jsonb NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE public."Rabbitmq" OWNER TO postgres;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "sessionId" text NOT NULL,
    creds text,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Session" OWNER TO postgres;

--
-- Name: Setting; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Setting" (
    id text NOT NULL,
    "rejectCall" boolean DEFAULT false NOT NULL,
    "msgCall" character varying(100),
    "groupsIgnore" boolean DEFAULT false NOT NULL,
    "alwaysOnline" boolean DEFAULT false NOT NULL,
    "readMessages" boolean DEFAULT false NOT NULL,
    "readStatus" boolean DEFAULT false NOT NULL,
    "syncFullHistory" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    "wavoipToken" character varying(100)
);


ALTER TABLE public."Setting" OWNER TO postgres;

--
-- Name: Sqs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Sqs" (
    id text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    events jsonb NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE public."Sqs" OWNER TO postgres;

--
-- Name: Template; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Template" (
    id text NOT NULL,
    "templateId" character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    template jsonb NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    "webhookUrl" character varying(500)
);


ALTER TABLE public."Template" OWNER TO postgres;

--
-- Name: Typebot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Typebot" (
    id text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    url character varying(500) NOT NULL,
    typebot character varying(100) NOT NULL,
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone,
    "triggerType" public."TriggerType",
    "triggerOperator" public."TriggerOperator",
    "triggerValue" text,
    "instanceId" text NOT NULL,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    description character varying(255)
);


ALTER TABLE public."Typebot" OWNER TO postgres;

--
-- Name: TypebotSetting; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TypebotSetting" (
    id text NOT NULL,
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    "debounceTime" integer,
    "typebotIdFallback" character varying(100),
    "ignoreJids" jsonb
);


ALTER TABLE public."TypebotSetting" OWNER TO postgres;

--
-- Name: Webhook; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Webhook" (
    id text NOT NULL,
    url character varying(500) NOT NULL,
    enabled boolean DEFAULT true,
    events jsonb,
    "webhookByEvents" boolean DEFAULT false,
    "webhookBase64" boolean DEFAULT false,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    headers jsonb
);


ALTER TABLE public."Webhook" OWNER TO postgres;

--
-- Name: Websocket; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Websocket" (
    id text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    events jsonb NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE public."Websocket" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: Chat; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Chat" (id, "remoteJid", labels, "createdAt", "updatedAt", "instanceId", name, "unreadMessages") FROM stdin;
\.


--
-- Data for Name: Chatwoot; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Chatwoot" (id, enabled, "accountId", token, url, "nameInbox", "signMsg", "signDelimiter", number, "reopenConversation", "conversationPending", "mergeBrazilContacts", "importContacts", "importMessages", "daysLimitImportMessages", "createdAt", "updatedAt", "instanceId", logo, organization, "ignoreJids") FROM stdin;
\.


--
-- Data for Name: Contact; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Contact" (id, "remoteJid", "pushName", "profilePicUrl", "createdAt", "updatedAt", "instanceId") FROM stdin;
\.


--
-- Data for Name: Dify; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Dify" (id, enabled, "botType", "apiUrl", "apiKey", expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "triggerType", "triggerOperator", "triggerValue", "createdAt", "updatedAt", "instanceId", description, "splitMessages", "timePerChar") FROM stdin;
\.


--
-- Data for Name: DifySetting; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DifySetting" (id, expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "createdAt", "updatedAt", "difyIdFallback", "instanceId", "splitMessages", "timePerChar") FROM stdin;
\.


--
-- Data for Name: EvolutionBot; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."EvolutionBot" (id, enabled, description, "apiUrl", "apiKey", expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "triggerType", "triggerOperator", "triggerValue", "createdAt", "updatedAt", "instanceId", "splitMessages", "timePerChar") FROM stdin;
\.


--
-- Data for Name: EvolutionBotSetting; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."EvolutionBotSetting" (id, expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "createdAt", "updatedAt", "botIdFallback", "instanceId", "splitMessages", "timePerChar") FROM stdin;
\.


--
-- Data for Name: Flowise; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Flowise" (id, enabled, description, "apiUrl", "apiKey", expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "triggerType", "triggerOperator", "triggerValue", "createdAt", "updatedAt", "instanceId", "splitMessages", "timePerChar") FROM stdin;
\.


--
-- Data for Name: FlowiseSetting; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FlowiseSetting" (id, expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "createdAt", "updatedAt", "flowiseIdFallback", "instanceId", "splitMessages", "timePerChar") FROM stdin;
\.


--
-- Data for Name: Instance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Instance" (id, name, "connectionStatus", "ownerJid", "profilePicUrl", integration, number, token, "clientName", "createdAt", "updatedAt", "profileName", "businessId", "disconnectionAt", "disconnectionObject", "disconnectionReasonCode") FROM stdin;
\.


--
-- Data for Name: IntegrationSession; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."IntegrationSession" (id, "sessionId", "remoteJid", "pushName", status, "awaitUser", "createdAt", "updatedAt", "instanceId", parameters, context, "botId", type) FROM stdin;
\.


--
-- Data for Name: IsOnWhatsapp; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."IsOnWhatsapp" (id, "remoteJid", "jidOptions", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Label; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Label" (id, "labelId", name, color, "predefinedId", "createdAt", "updatedAt", "instanceId") FROM stdin;
\.


--
-- Data for Name: Media; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Media" (id, "fileName", type, mimetype, "createdAt", "messageId", "instanceId") FROM stdin;
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Message" (id, key, "pushName", participant, "messageType", message, "contextInfo", source, "messageTimestamp", "chatwootMessageId", "chatwootInboxId", "chatwootConversationId", "chatwootContactInboxSourceId", "chatwootIsRead", "instanceId", "webhookUrl", "sessionId", status) FROM stdin;
\.


--
-- Data for Name: MessageUpdate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MessageUpdate" (id, "keyId", "remoteJid", "fromMe", participant, "pollUpdates", status, "messageId", "instanceId") FROM stdin;
\.


--
-- Data for Name: OpenaiBot; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OpenaiBot" (id, "assistantId", model, "systemMessages", "assistantMessages", "userMessages", "maxTokens", expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "triggerType", "triggerOperator", "triggerValue", "createdAt", "updatedAt", "openaiCredsId", "instanceId", enabled, "botType", description, "functionUrl", "splitMessages", "timePerChar") FROM stdin;
\.


--
-- Data for Name: OpenaiCreds; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OpenaiCreds" (id, "apiKey", "createdAt", "updatedAt", "instanceId", name) FROM stdin;
\.


--
-- Data for Name: OpenaiSetting; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OpenaiSetting" (id, expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "createdAt", "updatedAt", "openaiCredsId", "openaiIdFallback", "instanceId", "speechToText", "splitMessages", "timePerChar") FROM stdin;
\.


--
-- Data for Name: Proxy; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Proxy" (id, enabled, host, port, protocol, username, password, "createdAt", "updatedAt", "instanceId") FROM stdin;
\.


--
-- Data for Name: Pusher; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Pusher" (id, enabled, "appId", key, secret, cluster, "useTLS", events, "createdAt", "updatedAt", "instanceId") FROM stdin;
\.


--
-- Data for Name: Rabbitmq; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Rabbitmq" (id, enabled, events, "createdAt", "updatedAt", "instanceId") FROM stdin;
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Session" (id, "sessionId", creds, "createdAt") FROM stdin;
\.


--
-- Data for Name: Setting; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Setting" (id, "rejectCall", "msgCall", "groupsIgnore", "alwaysOnline", "readMessages", "readStatus", "syncFullHistory", "createdAt", "updatedAt", "instanceId", "wavoipToken") FROM stdin;
\.


--
-- Data for Name: Sqs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Sqs" (id, enabled, events, "createdAt", "updatedAt", "instanceId") FROM stdin;
\.


--
-- Data for Name: Template; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Template" (id, "templateId", name, template, "createdAt", "updatedAt", "instanceId", "webhookUrl") FROM stdin;
\.


--
-- Data for Name: Typebot; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Typebot" (id, enabled, url, typebot, expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "createdAt", "updatedAt", "triggerType", "triggerOperator", "triggerValue", "instanceId", "debounceTime", "ignoreJids", description) FROM stdin;
\.


--
-- Data for Name: TypebotSetting; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TypebotSetting" (id, expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "createdAt", "updatedAt", "instanceId", "debounceTime", "typebotIdFallback", "ignoreJids") FROM stdin;
\.


--
-- Data for Name: Webhook; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Webhook" (id, url, enabled, events, "webhookByEvents", "webhookBase64", "createdAt", "updatedAt", "instanceId", headers) FROM stdin;
\.


--
-- Data for Name: Websocket; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Websocket" (id, enabled, events, "createdAt", "updatedAt", "instanceId") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
466d1d26-df5f-4ffb-9bba-0e31280c4442	1af30cbbccd90152fbb1b99a458978e42428a792b822b4b5f9c9c7fffbf7264f	2025-10-22 14:18:27.638692+00	20240819154941_add_context_to_integration_session	\N	\N	2025-10-22 14:18:27.634156+00	1
67ef6df1-4be3-4982-97fe-f0b02b0c8f76	7507eff6b49fad53cdd0b3ace500f529597dfa1a8987afbb9807968a8ee8ef49	2025-10-22 14:18:27.142439+00	20240609181238_init	\N	\N	2025-10-22 14:18:26.875153+00	1
f8ca8b71-c880-45dc-918c-ff4e27b6f9fb	8c2a595975dc2f6dee831983304996e25c37014c48291576e7c8044078bfde32	2025-10-22 14:18:27.38469+00	20240722173259_add_name_column_to_openai_creds	\N	\N	2025-10-22 14:18:27.377454+00	1
c37ecac8-9389-4c79-b558-2bc42510f3c0	914eeefb9eba0dacdbcb7cdbe47567abd957543d6f27c39db4eec6a40c864008	2025-10-22 14:18:27.148322+00	20240610144159_create_column_profile_name_instance	\N	\N	2025-10-22 14:18:27.143501+00	1
3dc9e44c-cdca-4ebf-bb5e-27fac388346e	50d6920345af06dbd5086959784b7e2b4d163a5b555ff1029e5f81678a454444	2025-10-22 14:18:27.154316+00	20240611125754_create_columns_whitelabel_chatwoot	\N	\N	2025-10-22 14:18:27.149956+00	1
ce8c5f1f-fb5f-49ec-b638-202aa46a0b10	c29ccc88930138c50091712466f3f97bff48f6a0f486dcec5b19dc08c3612973	2025-10-22 14:18:27.473147+00	20240729180347_modify_typebot_session_status_openai_typebot_table	\N	\N	2025-10-22 14:18:27.444481+00	1
2c0679d4-9db4-4c2f-8858-05760e0cb814	b90c49299ed812fb46b71a4f0b9f818b7fc7109c52b1aff227a107236839d93c	2025-10-22 14:18:27.160216+00	20240611202817_create_columns_debounce_time_typebot	\N	\N	2025-10-22 14:18:27.155268+00	1
e3e7fd69-47d7-4ca9-b277-70f6b8873891	20b3c04d93799c25fa8b2d0a85d10f9280e915a5d7519542492ed85ff082a3c0	2025-10-22 14:18:27.389839+00	20240722173518_add_name_column_to_openai_creds	\N	\N	2025-10-22 14:18:27.385709+00	1
3174a8fe-7418-48cb-b6f0-fb8617aee4e1	01303057a037f5dc28272ac513b60d5a75be71d1bf727e671ca538db3268fa2e	2025-10-22 14:18:27.165457+00	20240712144948_add_business_id_column_to_instances	\N	\N	2025-10-22 14:18:27.161361+00	1
589e9822-7b1e-4270-9911-8ee35fd83327	34235c250eb1f088c285489ad690b4c045680f1638076436cdc66de0ea382cc2	2025-10-22 14:18:27.218038+00	20240712150256_create_templates_table	\N	\N	2025-10-22 14:18:27.166559+00	1
e4800bbb-6ae9-49ad-b3b5-a14d58ebb56c	0ba192ba428c9ab5a9b31d1f7d73603ee47b6192e2f8c590f6d93ade0dbdbccf	2025-10-22 14:18:27.237699+00	20240712155950_adjusts_in_templates_table	\N	\N	2025-10-22 14:18:27.222586+00	1
733741c0-b90c-4599-a53d-867f201cb18b	7ffb91b84cb7aa17b1f488d580626144cd557ccdfaec6654515545401d1938af	2025-10-22 14:18:27.397035+00	20240723152648_adjusts_in_column_openai_creds	\N	\N	2025-10-22 14:18:27.390864+00	1
7a48d16b-6902-48e3-828f-daf2359c7560	426256b73f7ea52538dc91a890179c841325a9c387cf02885b81971d582af830	2025-10-22 14:18:27.247671+00	20240712162206_remove_templates_table	\N	\N	2025-10-22 14:18:27.23873+00	1
1836cdcd-dbfb-47aa-9bc8-1687f739f9e5	3496739609829e80daf733baecd3d3e4e279bf318a99adc1ca3aa1c76f893b2f	2025-10-22 14:18:27.255896+00	20240712223655_column_fallback_typebot	\N	\N	2025-10-22 14:18:27.248708+00	1
6cd64d4e-7c17-46b7-8d25-eb34366dc3f3	c8627bad5d72ee4ef774ed32c95a2524517b0c60c49fa67cd4ba9dff7cbdde3b	2025-10-22 14:18:27.547799+00	20240811021156_add_chat_name_column	\N	\N	2025-10-22 14:18:27.543664+00	1
a89bc33e-c5db-4f6d-baa1-ea40b165b59e	bea48f697c0c5db52ade4a3f26c1321e3f5611c80ea50384baa54e58c6b3a79e	2025-10-22 14:18:27.26053+00	20240712230631_column_ignore_jids_typebot	\N	\N	2025-10-22 14:18:27.256802+00	1
5cae866a-e8e4-4fc9-8ad2-a2cbf9fcca5d	3056f8f1335e8933e4098f005e33cd4821190be2eb76520c0d01e2e13cf6e073	2025-10-22 14:18:27.401504+00	20240723200254_add_webhookurl_on_message	\N	\N	2025-10-22 14:18:27.397892+00	1
257704d4-f1ec-4391-8037-9a800169633d	1bac56740af5d2d6512b29e7a6e0721d69b2a290400f6660b92b6f2d8b30cd6e	2025-10-22 14:18:27.302052+00	20240713184337_add_media_table	\N	\N	2025-10-22 14:18:27.261478+00	1
5b656c72-dc62-4f7c-b975-fbb819a4d02c	bdd992b253321ca9a9556e30fea5e7760556cb8e80140aec34066301b55dc675	2025-10-22 14:18:27.370833+00	20240718121437_add_openai_tables	\N	\N	2025-10-22 14:18:27.304219+00	1
84324577-87de-46cf-9348-f60d94aa36d5	961a8627684fe1e4c7123565db3d16db30768df41881342032f9a2df16145eaf	2025-10-22 14:18:27.520704+00	20240730152156_create_dify_tables	\N	\N	2025-10-22 14:18:27.474638+00	1
34f7a0c6-d04c-4f6d-aa5f-7c116623f7ec	8147ec0cc86ac30ea1be05d461559ba5064273a3fcb3227af71ddcd895f5aebe	2025-10-22 14:18:27.376551+00	20240718123923_adjusts_openai_tables	\N	\N	2025-10-22 14:18:27.372044+00	1
4b1cdc35-a6b3-45d0-995a-de84eec53530	9d6c9b4ffe51483a851f6507f7aefd2fb34f54a7c28961856e3230fda4f87022	2025-10-22 14:18:27.422532+00	20240725184147_create_template_table	\N	\N	2025-10-22 14:18:27.402558+00	1
fc8d57f2-ac9c-461b-afc0-537c9ab4f4b9	94e2edb21107895c77b24402f41cd020c7f74dbb39b9a95664a45e62e2582be9	2025-10-22 14:18:27.43051+00	20240725202651_add_webhook_url_template_table	\N	\N	2025-10-22 14:18:27.424869+00	1
f19b7470-e225-434b-9c70-5801ab2eb6fc	d0da588e4204c50bde2e41a615b9301afca072991033545b6f4e3e34e088db87	2025-10-22 14:18:27.437051+00	20240725221646_modify_token_instance_table	\N	\N	2025-10-22 14:18:27.431586+00	1
2de4dd91-0a83-4ea2-ba02-2ef86c667192	b56b053451d564ff6282078fad4fc7bff4aa71e3b0b8d00bf219da4ed1bc4c86	2025-10-22 14:18:27.528889+00	20240801193907_add_column_speech_to_text_openai_setting_table	\N	\N	2025-10-22 14:18:27.522794+00	1
eeffdd12-068c-48d4-ab95-fb6519779e1f	a80f5c27cd80d088ea69153f8d6f4879406770ffa5a7fd50b28da82bd020322e	2025-10-22 14:18:27.443326+00	20240729115127_modify_trigger_type_openai_typebot_table	\N	\N	2025-10-22 14:18:27.438935+00	1
f59b4fbd-a10f-4040-a058-5bdda25827b5	428a9148f2a29f773e0c9813149e6d07bf51765e018652aeac0be2141a722b67	2025-10-22 14:18:27.57321+00	20240814173033_add_ignore_jids_chatwoot	\N	\N	2025-10-22 14:18:27.56925+00	1
c5c1c91e-5512-48a1-9a14-5cda07f9ec38	2b963cbc826ea024f9a643af2d5d9fcea06717c90ec9bacb255d3836efa06aea	2025-10-22 14:18:27.535323+00	20240803163908_add_column_description_on_integrations_table	\N	\N	2025-10-22 14:18:27.530067+00	1
75caea0d-9f5d-4cf6-8b3e-2fcd0a854bc8	ee44f0420384d55de6d252fffb8f2cfa88479e5811e14cfe975d8edfcc6957e0	2025-10-22 14:18:27.557273+00	20240811183328_add_unique_index_for_remoted_jid_and_instance_in_contacts	\N	\N	2025-10-22 14:18:27.54886+00	1
d89aa939-e351-407e-9547-02daa4692534	4d2dd947ebb7515c7c278472a10ebab6d5f41a5ef60e15df717a05d457d5d2aa	2025-10-22 14:18:27.542339+00	20240808210239_add_column_function_url_openaibot_table	\N	\N	2025-10-22 14:18:27.53681+00	1
8b2ed18c-82df-408d-afab-dd9c8bd250d8	29c330029a48aaee63567e63c4f4e57b7c1f5344162b11fbf61a4dc194547861	2025-10-22 14:18:27.568183+00	20240813003116_make_label_unique_for_instance	\N	\N	2025-10-22 14:18:27.560376+00	1
f482fff9-6f23-41e5-92eb-937ee6a5df72	bc5cd1c7fb4df72e88cb4856c9c49ea340284c9d8f389fe558008a921494ed82	2025-10-22 14:18:27.633078+00	20240817110155_add_trigger_type_advanced	\N	\N	2025-10-22 14:18:27.629134+00	1
83795083-517e-46ea-aff2-f0a133664df6	e1eb8997ac99fd555b8a9241c817b97fa5614124922b4e6b3cb1751e9e2199c7	2025-10-22 14:18:27.627799+00	20240814202359_integrations_unification	\N	\N	2025-10-22 14:18:27.574415+00	1
95688cd5-8b32-41a8-8c26-cd66ad0f9a48	a363a9ebc5bb526e504c4e6f71ed7702a5b6d317db6a9981f36c4560f9147fba	2025-10-22 14:18:27.651823+00	20240821120816_bot_id_integration_session	\N	\N	2025-10-22 14:18:27.640448+00	1
88b6472a-045d-4c7e-9ee9-e672055caed1	e31947e6c709ee3a62504980ae9ab1ffbfd9faf0cf9ac389cfd6435734c49902	2025-10-22 14:18:27.695694+00	20240821171327_add_generic_bot_table	\N	\N	2025-10-22 14:18:27.652858+00	1
ea6e7c16-0371-4b01-a6c7-1fbe017e9f43	18dde8e48c49a97f33f5b789ccd919326253c26d43af72c77f6b13d4285ffba8	2025-10-22 14:18:27.728259+00	20240821194524_add_flowise_table	\N	\N	2025-10-22 14:18:27.697508+00	1
112a8bbd-47c3-4ef7-954f-f11d3cf66755	0148a09e0e5eedafe5c5169c6351201a5c70ebaa853456693d75a7b82a851dbe	2025-10-22 14:18:27.735073+00	20240824161333_add_type_on_integration_sessions	\N	\N	2025-10-22 14:18:27.729585+00	1
f6a5712b-c7a6-4fd8-84ca-40600214e9b8	710e7ee3aabf07aa6ee9bf2865c09f75d461efa5724dd83f5a6f324ea1e5e47c	2025-10-22 14:18:27.788673+00	20240825130616_change_to_evolution_bot	\N	\N	2025-10-22 14:18:27.737065+00	1
08872129-bb8a-4777-bc82-42cf92a64145	d03a8a31df36eb0a07e80cd2a149b6d826e69bb2cb21fbe69943ae5ffba672ad	2025-10-22 14:18:27.805458+00	20240828140837_add_is_on_whatsapp_table	\N	\N	2025-10-22 14:18:27.789775+00	1
460fc304-b384-40cd-8cbb-8a172bdb341c	e927e00343b622bee7dab1b9b5c9fdd95007bfaf9d705ec52db9ecb05fb3d078	2025-10-22 14:18:27.811328+00	20240828141556_remove_name_column_from_on_whatsapp_table	\N	\N	2025-10-22 14:18:27.806466+00	1
b9aed80f-4e07-4690-adc7-2e1e7f7f2e30	cf00d8ef2c28cf94aea51e7e2a80ddd65474a4f6c1113abc65dea6cc194c1a57	2025-10-22 14:18:27.837146+00	20240830193533_changed_table_case	\N	\N	2025-10-22 14:18:27.813404+00	1
321de326-d857-4110-b234-6de7ff508c47	1cc60b9c38db62b694f753e2ee4c155e95c66815b5800f6ddb6f7cddec23b1ad	2025-10-22 14:18:27.842713+00	20240906202019_add_headers_on_webhook_config	\N	\N	2025-10-22 14:18:27.838227+00	1
49ae7ef1-69a2-449d-8cb5-e12e6dc3ef7e	7dff7227c1e013127210ab4f77b91dc24eae14bcd07f21fb27aaa2fa82b23865	2025-10-22 14:18:27.847933+00	20241001180457_add_message_status	\N	\N	2025-10-22 14:18:27.843766+00	1
8d547971-1483-4c4f-b161-31f78ee8d785	07449acbac59175f82670f34664c1dcea4d34f9a1710f19bd3396e26868db09e	2025-10-22 14:18:27.864533+00	20241006130306_alter_status_on_message_table	\N	\N	2025-10-22 14:18:27.848871+00	1
acadb8b5-457b-426e-b085-7f3a10b1b7fa	7e9a7c45f05285e9fea38ccfa4266790a099107605299d81c309e689c06494ef	2025-10-22 14:18:27.870292+00	20241007164026_add_unread_messages_on_chat_table	\N	\N	2025-10-22 14:18:27.865417+00	1
439068a1-4272-4e42-90df-ff1132bd2437	7e3e4686eb8009cbf0f71e8606a442b1c2862673dbc654b3f36f39a36efcb586	2025-10-22 14:18:27.886398+00	20241011085129_create_pusher_table	\N	\N	2025-10-22 14:18:27.872046+00	1
e8bb526f-1919-4c16-a81b-556739d59eab	270e1e51c7b9d24c0e68708ad167cb5748d591fd194ad422486574a0e83c0b79	2025-10-22 14:18:27.904006+00	20241011100803_split_messages_and_time_per_char_integrations	\N	\N	2025-10-22 14:18:27.887299+00	1
2a7d17eb-73eb-4bd0-98ce-8cf7ac586fb9	e82282df963a32556a9c8cd5fd908dd5810d4c35f0d7765ab9e844ebad1106a2	2025-10-22 14:18:27.933333+00	20241017144950_create_index	\N	\N	2025-10-22 14:18:27.906024+00	1
ad819ec7-425f-41c6-90aa-e4774b76e201	13f95f18438e1d778d8ffc96873625c2804efd732dc3db0c27209ce17e82ed57	2025-10-22 14:18:27.970743+00	20250116001415_add_wavoip_token_to_settings_table	\N	\N	2025-10-22 14:18:27.934192+00	1
\.


--
-- Name: Chat Chat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Chat"
    ADD CONSTRAINT "Chat_pkey" PRIMARY KEY (id);


--
-- Name: Chatwoot Chatwoot_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Chatwoot"
    ADD CONSTRAINT "Chatwoot_pkey" PRIMARY KEY (id);


--
-- Name: Contact Contact_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Contact"
    ADD CONSTRAINT "Contact_pkey" PRIMARY KEY (id);


--
-- Name: DifySetting DifySetting_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DifySetting"
    ADD CONSTRAINT "DifySetting_pkey" PRIMARY KEY (id);


--
-- Name: Dify Dify_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Dify"
    ADD CONSTRAINT "Dify_pkey" PRIMARY KEY (id);


--
-- Name: EvolutionBotSetting EvolutionBotSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EvolutionBotSetting"
    ADD CONSTRAINT "EvolutionBotSetting_pkey" PRIMARY KEY (id);


--
-- Name: EvolutionBot EvolutionBot_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EvolutionBot"
    ADD CONSTRAINT "EvolutionBot_pkey" PRIMARY KEY (id);


--
-- Name: FlowiseSetting FlowiseSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FlowiseSetting"
    ADD CONSTRAINT "FlowiseSetting_pkey" PRIMARY KEY (id);


--
-- Name: Flowise Flowise_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Flowise"
    ADD CONSTRAINT "Flowise_pkey" PRIMARY KEY (id);


--
-- Name: Instance Instance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Instance"
    ADD CONSTRAINT "Instance_pkey" PRIMARY KEY (id);


--
-- Name: IntegrationSession IntegrationSession_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."IntegrationSession"
    ADD CONSTRAINT "IntegrationSession_pkey" PRIMARY KEY (id);


--
-- Name: IsOnWhatsapp IsOnWhatsapp_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."IsOnWhatsapp"
    ADD CONSTRAINT "IsOnWhatsapp_pkey" PRIMARY KEY (id);


--
-- Name: Label Label_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Label"
    ADD CONSTRAINT "Label_pkey" PRIMARY KEY (id);


--
-- Name: Media Media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Media"
    ADD CONSTRAINT "Media_pkey" PRIMARY KEY (id);


--
-- Name: MessageUpdate MessageUpdate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MessageUpdate"
    ADD CONSTRAINT "MessageUpdate_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: OpenaiBot OpenaiBot_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OpenaiBot"
    ADD CONSTRAINT "OpenaiBot_pkey" PRIMARY KEY (id);


--
-- Name: OpenaiCreds OpenaiCreds_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OpenaiCreds"
    ADD CONSTRAINT "OpenaiCreds_pkey" PRIMARY KEY (id);


--
-- Name: OpenaiSetting OpenaiSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OpenaiSetting"
    ADD CONSTRAINT "OpenaiSetting_pkey" PRIMARY KEY (id);


--
-- Name: Proxy Proxy_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Proxy"
    ADD CONSTRAINT "Proxy_pkey" PRIMARY KEY (id);


--
-- Name: Pusher Pusher_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Pusher"
    ADD CONSTRAINT "Pusher_pkey" PRIMARY KEY (id);


--
-- Name: Rabbitmq Rabbitmq_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Rabbitmq"
    ADD CONSTRAINT "Rabbitmq_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: Setting Setting_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Setting"
    ADD CONSTRAINT "Setting_pkey" PRIMARY KEY (id);


--
-- Name: Sqs Sqs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sqs"
    ADD CONSTRAINT "Sqs_pkey" PRIMARY KEY (id);


--
-- Name: Template Template_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Template"
    ADD CONSTRAINT "Template_pkey" PRIMARY KEY (id);


--
-- Name: TypebotSetting TypebotSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TypebotSetting"
    ADD CONSTRAINT "TypebotSetting_pkey" PRIMARY KEY (id);


--
-- Name: Typebot Typebot_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Typebot"
    ADD CONSTRAINT "Typebot_pkey" PRIMARY KEY (id);


--
-- Name: Webhook Webhook_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Webhook"
    ADD CONSTRAINT "Webhook_pkey" PRIMARY KEY (id);


--
-- Name: Websocket Websocket_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Websocket"
    ADD CONSTRAINT "Websocket_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Chat_instanceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Chat_instanceId_idx" ON public."Chat" USING btree ("instanceId");


--
-- Name: Chat_remoteJid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Chat_remoteJid_idx" ON public."Chat" USING btree ("remoteJid");


--
-- Name: Chatwoot_instanceId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Chatwoot_instanceId_key" ON public."Chatwoot" USING btree ("instanceId");


--
-- Name: Contact_instanceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Contact_instanceId_idx" ON public."Contact" USING btree ("instanceId");


--
-- Name: Contact_remoteJid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Contact_remoteJid_idx" ON public."Contact" USING btree ("remoteJid");


--
-- Name: Contact_remoteJid_instanceId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Contact_remoteJid_instanceId_key" ON public."Contact" USING btree ("remoteJid", "instanceId");


--
-- Name: DifySetting_instanceId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DifySetting_instanceId_key" ON public."DifySetting" USING btree ("instanceId");


--
-- Name: EvolutionBotSetting_instanceId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "EvolutionBotSetting_instanceId_key" ON public."EvolutionBotSetting" USING btree ("instanceId");


--
-- Name: FlowiseSetting_instanceId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "FlowiseSetting_instanceId_key" ON public."FlowiseSetting" USING btree ("instanceId");


--
-- Name: Instance_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Instance_name_key" ON public."Instance" USING btree (name);


--
-- Name: IsOnWhatsapp_remoteJid_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IsOnWhatsapp_remoteJid_key" ON public."IsOnWhatsapp" USING btree ("remoteJid");


--
-- Name: Label_labelId_instanceId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Label_labelId_instanceId_key" ON public."Label" USING btree ("labelId", "instanceId");


--
-- Name: Media_fileName_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Media_fileName_key" ON public."Media" USING btree ("fileName");


--
-- Name: Media_messageId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Media_messageId_key" ON public."Media" USING btree ("messageId");


--
-- Name: MessageUpdate_instanceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MessageUpdate_instanceId_idx" ON public."MessageUpdate" USING btree ("instanceId");


--
-- Name: MessageUpdate_messageId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MessageUpdate_messageId_idx" ON public."MessageUpdate" USING btree ("messageId");


--
-- Name: Message_instanceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Message_instanceId_idx" ON public."Message" USING btree ("instanceId");


--
-- Name: OpenaiCreds_apiKey_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "OpenaiCreds_apiKey_key" ON public."OpenaiCreds" USING btree ("apiKey");


--
-- Name: OpenaiCreds_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "OpenaiCreds_name_key" ON public."OpenaiCreds" USING btree (name);


--
-- Name: OpenaiSetting_instanceId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "OpenaiSetting_instanceId_key" ON public."OpenaiSetting" USING btree ("instanceId");


--
-- Name: OpenaiSetting_openaiCredsId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "OpenaiSetting_openaiCredsId_key" ON public."OpenaiSetting" USING btree ("openaiCredsId");


--
-- Name: Proxy_instanceId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Proxy_instanceId_key" ON public."Proxy" USING btree ("instanceId");


--
-- Name: Pusher_instanceId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Pusher_instanceId_key" ON public."Pusher" USING btree ("instanceId");


--
-- Name: Rabbitmq_instanceId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Rabbitmq_instanceId_key" ON public."Rabbitmq" USING btree ("instanceId");


--
-- Name: Session_sessionId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Session_sessionId_key" ON public."Session" USING btree ("sessionId");


--
-- Name: Setting_instanceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Setting_instanceId_idx" ON public."Setting" USING btree ("instanceId");


--
-- Name: Setting_instanceId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Setting_instanceId_key" ON public."Setting" USING btree ("instanceId");


--
-- Name: Sqs_instanceId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Sqs_instanceId_key" ON public."Sqs" USING btree ("instanceId");


--
-- Name: Template_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Template_name_key" ON public."Template" USING btree (name);


--
-- Name: Template_templateId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Template_templateId_key" ON public."Template" USING btree ("templateId");


--
-- Name: TypebotSetting_instanceId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "TypebotSetting_instanceId_key" ON public."TypebotSetting" USING btree ("instanceId");


--
-- Name: Webhook_instanceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Webhook_instanceId_idx" ON public."Webhook" USING btree ("instanceId");


--
-- Name: Webhook_instanceId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Webhook_instanceId_key" ON public."Webhook" USING btree ("instanceId");


--
-- Name: Websocket_instanceId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Websocket_instanceId_key" ON public."Websocket" USING btree ("instanceId");


--
-- Name: Chat Chat_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Chat"
    ADD CONSTRAINT "Chat_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Chatwoot Chatwoot_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Chatwoot"
    ADD CONSTRAINT "Chatwoot_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Contact Contact_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Contact"
    ADD CONSTRAINT "Contact_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DifySetting DifySetting_difyIdFallback_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DifySetting"
    ADD CONSTRAINT "DifySetting_difyIdFallback_fkey" FOREIGN KEY ("difyIdFallback") REFERENCES public."Dify"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DifySetting DifySetting_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DifySetting"
    ADD CONSTRAINT "DifySetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Dify Dify_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Dify"
    ADD CONSTRAINT "Dify_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EvolutionBotSetting EvolutionBotSetting_botIdFallback_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EvolutionBotSetting"
    ADD CONSTRAINT "EvolutionBotSetting_botIdFallback_fkey" FOREIGN KEY ("botIdFallback") REFERENCES public."EvolutionBot"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EvolutionBotSetting EvolutionBotSetting_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EvolutionBotSetting"
    ADD CONSTRAINT "EvolutionBotSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EvolutionBot EvolutionBot_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EvolutionBot"
    ADD CONSTRAINT "EvolutionBot_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FlowiseSetting FlowiseSetting_flowiseIdFallback_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FlowiseSetting"
    ADD CONSTRAINT "FlowiseSetting_flowiseIdFallback_fkey" FOREIGN KEY ("flowiseIdFallback") REFERENCES public."Flowise"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FlowiseSetting FlowiseSetting_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FlowiseSetting"
    ADD CONSTRAINT "FlowiseSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Flowise Flowise_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Flowise"
    ADD CONSTRAINT "Flowise_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: IntegrationSession IntegrationSession_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."IntegrationSession"
    ADD CONSTRAINT "IntegrationSession_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Label Label_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Label"
    ADD CONSTRAINT "Label_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Media Media_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Media"
    ADD CONSTRAINT "Media_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Media Media_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Media"
    ADD CONSTRAINT "Media_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public."Message"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MessageUpdate MessageUpdate_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MessageUpdate"
    ADD CONSTRAINT "MessageUpdate_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MessageUpdate MessageUpdate_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MessageUpdate"
    ADD CONSTRAINT "MessageUpdate_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public."Message"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."IntegrationSession"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OpenaiBot OpenaiBot_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OpenaiBot"
    ADD CONSTRAINT "OpenaiBot_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OpenaiBot OpenaiBot_openaiCredsId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OpenaiBot"
    ADD CONSTRAINT "OpenaiBot_openaiCredsId_fkey" FOREIGN KEY ("openaiCredsId") REFERENCES public."OpenaiCreds"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OpenaiCreds OpenaiCreds_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OpenaiCreds"
    ADD CONSTRAINT "OpenaiCreds_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OpenaiSetting OpenaiSetting_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OpenaiSetting"
    ADD CONSTRAINT "OpenaiSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OpenaiSetting OpenaiSetting_openaiCredsId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OpenaiSetting"
    ADD CONSTRAINT "OpenaiSetting_openaiCredsId_fkey" FOREIGN KEY ("openaiCredsId") REFERENCES public."OpenaiCreds"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OpenaiSetting OpenaiSetting_openaiIdFallback_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OpenaiSetting"
    ADD CONSTRAINT "OpenaiSetting_openaiIdFallback_fkey" FOREIGN KEY ("openaiIdFallback") REFERENCES public."OpenaiBot"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Proxy Proxy_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Proxy"
    ADD CONSTRAINT "Proxy_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Pusher Pusher_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Pusher"
    ADD CONSTRAINT "Pusher_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Rabbitmq Rabbitmq_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Rabbitmq"
    ADD CONSTRAINT "Rabbitmq_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Session Session_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Setting Setting_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Setting"
    ADD CONSTRAINT "Setting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Sqs Sqs_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sqs"
    ADD CONSTRAINT "Sqs_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Template Template_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Template"
    ADD CONSTRAINT "Template_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TypebotSetting TypebotSetting_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TypebotSetting"
    ADD CONSTRAINT "TypebotSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TypebotSetting TypebotSetting_typebotIdFallback_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TypebotSetting"
    ADD CONSTRAINT "TypebotSetting_typebotIdFallback_fkey" FOREIGN KEY ("typebotIdFallback") REFERENCES public."Typebot"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Typebot Typebot_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Typebot"
    ADD CONSTRAINT "Typebot_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Webhook Webhook_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Webhook"
    ADD CONSTRAINT "Webhook_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Websocket Websocket_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Websocket"
    ADD CONSTRAINT "Websocket_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict OcVvdin08saMuhOLGrpcJdpXMHUs6bBFndfTPvRfZ3dcmSW4mhV7DRmyILDlf1z

