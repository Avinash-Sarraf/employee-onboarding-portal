import { Link } from "react-router-dom";
import { PageContainer, PageTitle } from "../components/layout/PageContainer";

export function TermsPage() {
  return (
    <PageContainer size="narrow" className="pb-16">
      <PageTitle
        title="Terms & Conditions"
        subtitle="Rules of use for the employee onboarding platform. Replace with your organization’s terms."
      />
      <div className="prose prose-slate max-w-none space-y-4 text-sm text-slate-600 dark:prose-invert dark:text-slate-400">
        <p>
          This is a <strong>placeholder terms document</strong>. Your legal team should define
          acceptable use, account security, intellectual property, limitation of liability, and
          governing law.
        </p>
        <p>
          Continue to{" "}
          <Link to="/register" className="font-medium text-indigo-600 dark:text-indigo-400">
            create an account
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

export default TermsPage;
