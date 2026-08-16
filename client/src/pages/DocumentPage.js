import UploadForm from "../components/UploadForm";
import { PageContainer, PageTitle } from "../components/layout/PageContainer";

const DocumentPage = () => {
  return (
    <PageContainer>
      <PageTitle
        title="Documents"
        subtitle="Upload onboarding files for HR review. You can replace a file any time; each new upload is set back to pending until verified."
      />
      <UploadForm />
    </PageContainer>
  );
};

export default DocumentPage;
