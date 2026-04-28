import ContentPageTemplate from './ContentPageTemplate.jsx';
import './CustomerSupportPage.css';

export default function CustomerSupportPage() {
  return (
    <ContentPageTemplate
      eyebrow="Support"
      title="Customer Support"
      description="Support topics and contact options will load from the backend/admin panel."
      endpoint="/support"
      emptyTitle="No customer support available"
      emptyMessage="Add customer support content in the backend/admin panel to show it here."
      actions={[{ to: '/', label: 'Main page' }]}
    />
  );
}
