import ContentPageTemplate from './ContentPageTemplate.jsx';
import './FaqPage.css';

export default function FaqPage() {
  return (
    <ContentPageTemplate
      eyebrow="Support"
      title="FAQ"
      description="Frequently asked questions will load from the backend/admin panel."
      endpoint="/other/faq"
      emptyTitle="No faq available"
      emptyMessage="Add faq content in the backend/admin panel to show it here."
      actions={[{ to: '/', label: 'Main page' }]}
    />
  );
}
