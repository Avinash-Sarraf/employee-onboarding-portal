import { Link } from "react-router-dom";
import { PageContainer, PageTitle } from "../components/layout/PageContainer";

export function PrivacyPolicyPage() {
  return (
    <PageContainer size="narrow" className="pb-16">
      <PageTitle
        title="Privacy Policy"
        subtitle="How we handle information in the onboarding portal. Replace this placeholder with your organization’s legal text."
      />
      <div className="prose prose-slate max-w-none space-y-4 text-sm text-slate-600 dark:prose-invert dark:text-slate-400">
        <p>
          This is a <strong>placeholder privacy policy</strong> for demonstration. Your company
          should publish a policy that describes what data is collected (profile, documents,
          messages), how it is stored, retention, subprocessors, and user rights.
        </p>
        <p>
          For questions, contact your HR or IT administrator. You can return to the{" "}
          <Link to="/" className="font-medium text-indigo-600 dark:text-indigo-400">
            home page
          </Link>{" "}
          or{" "}
          <Link to="/login" className="font-medium text-indigo-600 dark:text-indigo-400">
            sign in
          </Link>
          .
        </p>
      </div>
    </PageContainer>
  );
}

export default PrivacyPolicyPage;
