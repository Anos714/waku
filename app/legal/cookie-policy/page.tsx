import type { Metadata } from "next";
import { Lead, LegalLayout, Point, Points, Section } from "@/components/legal/legal-layout";
import { CONTACT_EMAIL, mailto } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "The cookies and local storage Waku uses, the ones it does not, and how to clear all of it.",
};

export default function CookiePolicyPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Cookie Policy"
      description="Waku uses one essential cookie to keep you signed in, and local storage to remember your draft. No tracking, no advertising. Here is the whole picture."
      lastUpdated="October 13, 2026"
    >
      <Section number={1} title="What a cookie is">
        <Points>
          <Point>
            A cookie is a small file a website stores in your browser. It is how
            a site remembers you between page loads (that you are signed in,
            for instance).
          </Point>
          <Point>
            Cookies are not programs, and they cannot read anything else on your
            computer.
          </Point>
        </Points>
      </Section>

      <Section number={2} title="The cookie Waku sets">
        <Lead>Exactly one, and it is essential.</Lead>
        <Points>
          <Point>
            <strong>The session cookie.</strong> Once you sign in, this signed
            cookie proves you are you on the next request. It is what lets you
            publish. It contains no personal data, only an opaque session token;
            the matching session lives server-side and expires on its own.
          </Point>
          <Point>
            Without it there is no way to stay signed in, so it is not optional.
          </Point>
          <Point>
            It is set only after you choose to sign in. An anonymous visitor
            receives no cookie from us at all.
          </Point>
        </Points>
      </Section>

      <Section number={3} title="Local storage: the draft">
        <Points>
          <Point>
            Waku stores your in-progress profile in your browser&rsquo;s local
            storage, not in a cookie, which is why the editor works offline and
            survives a refresh.
          </Point>
          <Point>
            Nothing leaves your browser until you hit publish.
          </Point>
          <Point>
            Clearing your browser&rsquo;s stored data removes the draft
            permanently. Since we never received it, we cannot restore it.
          </Point>
        </Points>
      </Section>

      <Section number={4} title="What we do not use cookies for">
        <Points>
          <Point>
            <strong>Analytics.</strong> There is no tracking cookie counting
            your visits.
          </Point>
          <Point>
            <strong>Advertising.</strong> No ad networks run here, so no ad
            cookie is ever set.
          </Point>
          <Point>
            <strong>Cross-site tracking.</strong> Nothing follows you to other
            websites.
          </Point>
          <Point>
            <strong>Fingerprinting for identification.</strong> The rating
            fingerprint is a one-way hash used only to keep ratings
            one-per-person (see the{" "}
            <a href="/legal/privacy-policy">Privacy Policy</a>).
          </Point>
        </Points>
      </Section>

      <Section number={5} title="Third-party services">
        <Points>
          <Point>
            Signing in happens on GitHub&rsquo;s or Google&rsquo;s own pages.
            Those providers may set their own cookies on <em>their</em> domains
            as part of that flow. We do not control them, and they are governed
            by their own policies.
          </Point>
          <Point>
            Delivered images come from Cloudinary, which may use its own cookies
            to serve them efficiently.
          </Point>
        </Points>
      </Section>

      <Section number={6} title="Controlling cookies yourself">
        <Points>
          <Point>
            Every browser lets you view, block and delete cookies, usually under
            Settings &rarr; Privacy.
          </Point>
          <Point>
            Blocking the session cookie only means signing in again.
          </Point>
          <Point>
            The editor, the themes, card export and the QR generator all work
            with cookies disabled.
          </Point>
        </Points>
      </Section>

      <Section number={7} title="Changes to this policy">
        <Points>
          <Point>
            If a new feature needs a cookie, this page will say so plainly and
            the date at the top will move.
          </Point>
          <Point>
            &ldquo;We updated our cookie policy&rdquo; will never be a surprise
            buried in the footer.
          </Point>
        </Points>
      </Section>

      <Section number={8} title="Contact">
        <Points>
          <Point>
            Anything unclear? <a href={mailto(CONTACT_EMAIL)}>{CONTACT_EMAIL}</a>.
          </Point>
        </Points>
      </Section>
    </LegalLayout>
  );
}
