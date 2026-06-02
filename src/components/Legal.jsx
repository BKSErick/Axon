import React from 'react';
import { C } from '../data/db';
import { Btn } from './Common';

const Container = ({ title, children }) => (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, padding: "60px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: C.grad, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                    <span style={{ color: "#fff", fontWeight: 900, fontSize: 22 }}>M</span>
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 800 }}>{title}</h1>
                <p style={{ color: C.muted, marginTop: 10 }}>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            <div style={{ background: C.card, borderRadius: 20, padding: 32, border: `1px solid ${C.border}`, lineHeight: 1.8, fontSize: 15, color: C.dim }}>
                {children}
            </div>
            <div style={{ textAlign: "center", marginTop: 40 }}>
                <Btn onClick={() => window.location.href = "/"} variant="ghost">Voltar para o Início</Btn>
            </div>
        </div>
    </div>
);

export const PrivacyPolicy = () => (
    <Container title="Privacy Policy / Política de Privacidade">
        <h2>1. Introduction</h2>
        <p>ADS_Grow ("MetaReports") values your privacy. This policy explains how we collect, use, and protect your data when you use our social media management and advertising analytics platform.</p>

        <h2>2. Data We Collect</h2>
        <p>We collect only the information necessary for integration with the Meta Marketing API and Meta Graph API:</p>
        <ul style={{ marginLeft: 20, marginBottom: 16 }}>
            <li><strong>Account Information:</strong> Name, email address, and authentication tokens</li>
            <li><strong>Facebook Page Data:</strong> Page IDs, Page Access Tokens, and page content metrics</li>
            <li><strong>Instagram Data:</strong> Instagram Business Account IDs and content metrics</li>
            <li><strong>Ad Account Data:</strong> Ad account IDs, campaign performance metrics, and spend data</li>
            <li><strong>User-Generated Content:</strong> Post text, uploaded images/videos for social media publishing</li>
        </ul>

        <h2>3. How We Use Your Data</h2>
        <p>Your data is used exclusively to:</p>
        <ul style={{ marginLeft: 20, marginBottom: 16 }}>
            <li>Display advertising performance metrics in our dashboard</li>
            <li>Create and schedule social media posts on Facebook and Instagram on your behalf</li>
            <li>Publish approved content to your connected Facebook Pages and Instagram Business accounts</li>
            <li>Analyze post engagement to suggest optimal publishing times</li>
            <li>Generate AI-powered content suggestions based on your briefings</li>
        </ul>

        <h2>4. Data Sharing</h2>
        <p>We do NOT sell, share, or transfer your data to third parties. Your data is only transmitted to Meta's APIs for the specific purpose of managing your social media content and viewing campaign metrics.</p>

        <h2>5. Data Storage & Security</h2>
        <p>All data is stored securely in Supabase (PostgreSQL) with Row Level Security (RLS) enabled. Page tokens and access credentials are stored encrypted and are only used for API calls on your behalf.</p>

        <h2>6. Data Deletion</h2>
        <p>You can request the deletion of your data at any time by:</p>
        <ul style={{ marginLeft: 20, marginBottom: 16 }}>
            <li>Visiting our <a href="/data-deletion" style={{ color: '#00d4aa' }}>Data Deletion Page</a></li>
            <li>Revoking app access via your Facebook Settings → Business Integrations</li>
            <li>Contacting us at: contato@backstagegrow.com.br</li>
        </ul>

        <h2>7. Contact</h2>
        <p>For any questions about this privacy policy, contact us at: <strong>contato@backstagegrow.com.br</strong></p>
    </Container>
);

export const DataDeletion = () => (
    <Container title="Data Deletion Request / Solicitação de Exclusão de Dados">
        <h2>How to Request Data Deletion</h2>
        <p>You can request the deletion of all your data stored by ADS_Grow (MetaReports) at any time.</p>

        <h2>Option 1: Revoke Access</h2>
        <p>Remove our app from your Facebook account:</p>
        <ol style={{ marginLeft: 20, marginBottom: 16 }}>
            <li>Go to your <strong>Facebook Settings</strong></li>
            <li>Click <strong>Security and Login</strong> → <strong>Business Integrations</strong></li>
            <li>Find <strong>ADS_Grow</strong> and click <strong>Remove</strong></li>
        </ol>
        <p>Once removed, we will automatically delete all tokens and credentials associated with your account within 48 hours.</p>

        <h2>Option 2: Email Request</h2>
        <p>Send an email to <strong>contato@backstagegrow.com.br</strong> with the subject line "Data Deletion Request" and include:</p>
        <ul style={{ marginLeft: 20, marginBottom: 16 }}>
            <li>Your full name</li>
            <li>The email associated with your account</li>
            <li>Your Facebook Page name (if applicable)</li>
        </ul>
        <p>We will process your request and delete all associated data within <strong>30 days</strong>.</p>

        <h2>What Gets Deleted</h2>
        <ul style={{ marginLeft: 20, marginBottom: 16 }}>
            <li>All stored access tokens and page tokens</li>
            <li>Uploaded media files (images and videos)</li>
            <li>Post content and scheduling data</li>
            <li>Analytics and engagement data cached from Meta APIs</li>
            <li>Your profile and account information</li>
        </ul>

        <h2>Confirmation</h2>
        <p>You will receive a confirmation email once your data deletion has been completed.</p>

        <h2>Contact</h2>
        <p>Questions? Contact us at: <strong>contato@backstagegrow.com.br</strong></p>
    </Container>
);

export const TermsOfService = () => (
    <Container title="Terms of Service / Termos de Serviço">
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing and using the ADS_Grow (MetaReports) platform, you agree to comply with these terms.</p>

        <h2>2. Service Description</h2>
        <p>Our platform provides social media management tools including content creation with AI, post scheduling, publishing to Facebook and Instagram via Meta Graph API, and advertising analytics visualization.</p>

        <h2>3. Third-Party Integration</h2>
        <p>This service requires integration with Meta's Marketing and Graph APIs. You agree to comply with Meta's own terms and policies when using our platform.</p>

        <h2>4. Content Responsibility</h2>
        <p>You are responsible for all content created, published, or scheduled through our platform. ADS_Grow does not review or moderate content before publication.</p>

        <h2>5. Limitation of Liability</h2>
        <p>ADS_Grow is not responsible for business decisions made based on data displayed in the dashboard, nor for any content published through the platform.</p>

        <h2>6. Contact</h2>
        <p>For questions about these terms, contact: <strong>contato@backstagegrow.com.br</strong></p>
    </Container>
);
