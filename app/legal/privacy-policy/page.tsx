import type { Metadata } from "next";
import { Lead, LegalLayout, Point, Points, Section, SubLabel } from "@/components/legal/legal-layout";
import { CONTACT_EMAIL, GITHUB_REPO_URL, mailto } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What Waku collects, what it deliberately does not, where your data lives, and how to have it removed.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Privacy Policy"
      description="The short version: the editor runs in your browser, nothing is uploaded until you publish, and we never sell anything. The full version is below."
      lastUpdated="October 13, 2026"
    >
      <Section number={1} title="The one-minute version">
        <Lead>
          Waku is a personal identity builder. You compose a profile page and a
          matching identity card <strong>in your browser</strong>, and that
          draft stays in your browser until you choose to publish it.
        </Lead>
        <Points>
          <Point>
            Publishing is the only path that writes anything to our servers, and
            it requires an account.
          </Point>
          <Point>We do not run advertising trackers.</Point>
          <Point>We do not sell or rent your data.</Point>
          <Point>
            We do not build a profile of you to sell to anyone. Everything
            below is the detail behind those three sentences.
          </Point>
        </Points>
      </Section>

      <Section number={2} title="What we collect">
        <SubLabel>Account information</SubLabel>
        <Points>
          <Point>
            Signing in happens through GitHub or Google. We receive the name,
            email address and profile picture your provider shares with us, plus
            a token that keeps you signed in.
          </Point>
          <Point>
            We never see the password you use with that provider.
          </Point>
        </Points>
        <SubLabel>Profile content</SubLabel>
        <Points>
          <Point>
            Anything you publish (name, role, bio, tagline, skills, social
            links and your photo) is stored so your page can be served to
            anyone who opens your link.
          </Point>
        </Points>
        <SubLabel>Ratings and messages</SubLabel>
        <Points>
          <Point>
            A rating left on the <a href="/rate">rate</a> page stores the name,
            the star score, the message you choose to write, and a fingerprint of
            your IP address and browser.
          </Point>
        </Points>
        <SubLabel>Server logs</SubLabel>
        <Points>
          <Point>
            Our hosting provider records routine request metadata (IP address,
            timestamps, user agent) as part of operating the service and
            protecting it from abuse.
          </Point>
        </Points>
      </Section>

      <Section number={3} title="What we deliberately do not collect">
        <Points>
          <Point>
            <strong>Your unpublished drafts.</strong> They live in your
            browser&rsquo;s <code>localStorage</code>. Clear your browser
            storage and they are gone. We never had them.
          </Point>
          <Point>
            <strong>Analytics or advertising profiles.</strong> There is no
            marketing pixel, no ad SDK and no cross-site tracker here.
          </Point>
          <Point>
            <strong>Payment data.</strong> Waku has no billing system, so there
            is nothing of the kind to hold.
          </Point>
        </Points>
      </Section>

      <Section number={4} title="How we use your information">
        <Points>
          <Point>To create and keep your account, and to keep you signed in.</Point>
          <Point>To serve your published profile page at the link you own.</Point>
          <Point>
            To display ratings you submit, so other visitors can see them.
          </Point>
          <Point>
            To generate AI-written bios and taglines when you ask for them.
          </Point>
          <Point>To reply when you write to us.</Point>
          <Point>
            To keep the service available and protect it from automated abuse,
            the only reason the rating fingerprint exists.
          </Point>
        </Points>
      </Section>

      <Section number={5} title="Where your data lives">
        <Points>
          <Point>
            Published profiles and accounts are stored in a Neon Postgres
            database.
          </Point>
          <Point>
            Uploaded photos are stored and delivered by Cloudinary.
          </Point>
          <Point>
            Both are reputable, purpose-built services; neither gets access to
            anything beyond what is needed to run the feature it runs.
          </Point>
        </Points>
      </Section>

      <Section id="section-6" number={6} title="Ratings and the fingerprint">
        <Points>
          <Point>
            To keep one person from flooding the ratings, we hash your IP
            address and browser user agent into a single fingerprint and store
            only that hash, not the raw values.
          </Point>
          <Point>
            The fingerprint is unique to you, so it also lets you revise your own
            rating instead of adding a second one.
          </Point>
          <Point>It cannot be reversed to identify you.</Point>
        </Points>
      </Section>

      <Section number={7} title="The AI bio writer">
        <Points>
          <Point>
            When you ask for an AI-written bio or tagline, the fields you have
            filled in are sent to Google&rsquo;s Gemini API server-side, purely
            to generate that text for you.
          </Point>
          <Point>
            The draft is yours to edit or discard before it is ever published.
          </Point>
          <Point>
            Nothing about the request is stored on our side beyond ordinary
            server logs.
          </Point>
        </Points>
      </Section>

      <Section number={8} title="Public content">
        <Points>
          <Point>
            A published profile page is public. That is the point. It is
            reachable by anyone who has or guesses your link, and may be indexed
            by search engines.
          </Point>
          <Point>Please publish only what you are comfortable making public.</Point>
        </Points>
      </Section>

      <Section number={9} title="Your rights">
        <Points>
          <Point>
            You can edit or delete your published profile from the editor at any
            time.
          </Point>
          <Point>
            For anything else (a copy of what we hold about you, or complete
            erasure of your account and pages), write to{" "}
            <a href={mailto(CONTACT_EMAIL)}>{CONTACT_EMAIL}</a> and we will act
            on it without making you justify yourself.
          </Point>
        </Points>
      </Section>

      <Section number={10} title="Children">
        <Points>
          <Point>Waku is not intended for children under 13.</Point>
          <Point>
            We do not knowingly collect their data; if you believe a child has
            signed up, contact us and the account will be removed.
          </Point>
        </Points>
      </Section>

      <Section number={11} title="Security">
        <Points>
          <Point>
            Secrets (database credentials, API keys, OAuth secrets) never leave
            the server.
          </Point>
          <Point>Sessions are signed cookies.</Point>
          <Point>Uploads are validated before they are accepted.</Point>
          <Point>
            No service is immune to compromise, but nothing here is stored more
            broadly than it needs to be.
          </Point>
        </Points>
      </Section>

      <Section number={12} title="Changes to this policy">
        <Points>
          <Point>
            If a change is material we will say so here and update the date at
            the top.
          </Point>
          <Point>
            Continuing to use Waku after a change means you are comfortable with
            the updated policy.
          </Point>
        </Points>
      </Section>

      <Section number={13} title="Contact">
        <Points>
          <Point>
            Questions, requests, or a data-deletion ask:{" "}
            <a href={mailto(CONTACT_EMAIL)}>{CONTACT_EMAIL}</a>.
          </Point>
          <Point>
            The source code behind everything described here is public at{" "}
            <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            , so you can verify any of it yourself.
          </Point>
        </Points>
      </Section>
    </LegalLayout>
  );
}
