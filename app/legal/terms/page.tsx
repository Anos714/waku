import type { Metadata } from "next";
import { Lead, LegalLayout, Point, Points, Section } from "@/components/legal/legal-layout";
import { CONTACT_EMAIL, GITHUB_REPO_URL, mailto } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description:
    "The rules of using Waku: your account, your content, what happens when you publish, and the limits of the service.",
};

export default function TermsPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Terms and Conditions"
      description="By using Waku you agree to these terms. They are written to be read, so they say what they mean and skip the rest."
      lastUpdated="October 13, 2026"
    >
      <Section number={1} title="Accepting these terms">
        <Points>
          <Point>
            Using Waku (visiting, building a profile, publishing a page, or
            leaving a rating) means you accept these terms.
          </Point>
          <Point>If you do not, please do not use the service.</Point>
          <Point>
            If you are accepting on behalf of an organisation, you confirm you
            have the authority to bind it.
          </Point>
        </Points>
      </Section>

      <Section number={2} title="What Waku is">
        <Points>
          <Point>
            Waku is a personal identity builder: it lets you compose a profile
            page and a matching shareable identity card in your browser, then
            publish that page at a link you own.
          </Point>
          <Point>
            The editor, every theme, the card export and the QR generator work
            entirely client-side.
          </Point>
          <Point>Publishing requires an account.</Point>
        </Points>
      </Section>

      <Section number={3} title="Your account">
        <Points>
          <Point>
            Accounts are created through GitHub or Google. You are responsible
            for keeping your provider account secure.
          </Point>
          <Point>
            You must be at least 13 years old, or old enough to consent in your
            jurisdiction.
          </Point>
          <Point>
            You are responsible for what happens under your account. Tell us
            immediately if you think someone else has access to it.
          </Point>
          <Point>
            One account per person. Publishing requires an account precisely so
            every public page has an accountable owner.
          </Point>
        </Points>
      </Section>

      <Section number={4} title="Your content">
        <Lead>
          Everything you create here (your profile text, links and photos)
          stays yours. You own it.
        </Lead>
        <Points>
          <Point>
            Publishing grants Waku the limited licence it needs to run the
            service: to host your page, to render it, and to deliver your images.
          </Point>
          <Point>
            That licence ends when you unpublish or delete the page. It is not a
            transfer of ownership and it is not a right to use your content for
            anything else.
          </Point>
          <Point>
            You confirm that your content is yours to publish, that it does not
            infringe anyone else&rsquo;s rights, and that it is accurate enough
            not to mislead.
          </Point>
        </Points>
      </Section>

      <Section id="section-5" number={5} title="What you may not do">
        <Points>
          <Point>Publish anything illegal in the place you publish it from.</Point>
          <Point>
            Infringe trademarks, copyrights, privacy or publicity rights of
            another person.
          </Point>
          <Point>
            Impersonate someone else, or present a page as official when it is
            not.
          </Point>
          <Point>
            Spread malware, phishing or anything designed to deceive or harm a
            visitor.
          </Point>
          <Point>
            Harass, threaten or degrade a person or group, including in the
            message attached to a rating.
          </Point>
          <Point>
            Attempt to break, overload or reverse-engineer the service, or
            automate it against its intended use.
          </Point>
        </Points>
        <Lead>
          We may remove content that breaks these rules, unpublish the page it is
          on, or close the account behind it, at our discretion and without notice
          where the situation calls for speed.
        </Lead>
      </Section>

      <Section number={6} title="Publishing and public pages">
        <Points>
          <Point>
            <strong>You choose to publish.</strong> Nothing is published
            automatically; the draft is yours in your browser until you decide.
          </Point>
          <Point>
            <strong>The server assigns your URL.</strong> Public slugs are minted
            on publish and their ownership is decided by the database, so a link
            can never accidentally point at someone else&rsquo;s page.
          </Point>
          <Point>
            <strong>Published pages are public.</strong> Anyone with the link can
            open them, and search engines may index them.
          </Point>
          <Point>
            <strong>You can leave at any time.</strong> Unpublishing removes the
            page; write to us to have the account and its data erased fully.
          </Point>
        </Points>
      </Section>

      <Section number={7} title="AI-assisted writing">
        <Points>
          <Point>
            The AI bio and tagline writer drafts text for you from the fields
            you have filled in. It is a starting point, not an author.
          </Point>
          <Point>
            Whatever you publish under your name is your content, and you are
            responsible for confirming it is accurate and yours to use.
          </Point>
          <Point>Never publish an AI draft you have not read.</Point>
        </Points>
      </Section>

      <Section number={8} title="Ratings">
        <Points>
          <Point>
            Ratings are public and attributed to the name you give.
          </Point>
          <Point>One rating per visitor; revising your rating replaces the old one.</Point>
          <Point>
            Messages that break <a href="#section-5">section 5</a> may be removed
            without notice, and we may hide any rating at our discretion.
          </Point>
        </Points>
      </Section>

      <Section number={9} title="Waku&rsquo;s own rights">
        <Points>
          <Point>
            Waku, its name and its visual design are ours.
          </Point>
          <Point>
            The software itself is open source under the MIT licence, which
            governs the code but not the service&rsquo;s trademarks or branding.
          </Point>
        </Points>
      </Section>

      <Section number={10} title="Availability and changes">
        <Points>
          <Point>
            We aim for the service to stay up, but we do not promise it will be
            uninterrupted or error-free.
          </Point>
          <Point>
            We may change, suspend or retire any feature, including a theme or
            a card layout, after giving published pages a chance to adapt.
          </Point>
        </Points>
      </Section>

      <Section number={11} title="Disclaimers">
        <Points>
          <Point>Waku is provided as is.</Point>
          <Point>
            To the fullest extent the law allows, we make no warranty that the
            service will meet your needs, run without error, or remain available
            indefinitely.
          </Point>
          <Point>
            We disclaim responsibility for the content other users publish.
          </Point>
        </Points>
      </Section>

      <Section number={12} title="Limitation of liability">
        <Points>
          <Point>
            To the fullest extent the law allows, neither Waku nor its operator
            is liable for any indirect, incidental or consequential loss arising
            from your use of the service, including loss of data, loss of a
            published link, or damage to reputation from content published by
            anyone.
          </Point>
          <Point>
            Where the law sets a cap on liability that cannot be excluded,
            liability is capped at the amount you paid us for the service, which
            is zero.
          </Point>
        </Points>
      </Section>

      <Section number={13} title="Ending the terms">
        <Points>
          <Point>You can stop using Waku whenever you like.</Point>
          <Point>
            We may suspend or terminate access if these terms are broken, or if
            keeping an account becomes legally or technically untenable.
          </Point>
          <Point>
            Sections that by their nature survive (ownership, licences already
            granted, disclaimers and liability caps) survive termination.
          </Point>
        </Points>
      </Section>

      <Section number={14} title="Changes to these terms">
        <Points>
          <Point>
            Material changes will be posted here with an updated date at the top.
          </Point>
          <Point>
            Continuing to use Waku afterwards means you accept the revised terms.
          </Point>
          <Point>
            When a change is substantial enough to affect existing published
            pages, we will say so before it takes effect.
          </Point>
        </Points>
      </Section>

      <Section number={15} title="Contact">
        <Points>
          <Point>
            The person behind Waku is{" "}
            <a href={mailto(CONTACT_EMAIL)}>{CONTACT_EMAIL}</a>.
          </Point>
          <Point>
            The code is at{" "}
            <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            , and issues raised there are read.
          </Point>
        </Points>
      </Section>
    </LegalLayout>
  );
}
