import ContentPageTemplate from './ContentPageTemplate.jsx';
import './FaqPage.css';

export default function FaqPage() {
  return (
    <ContentPageTemplate
      eyebrow="Support"
      title="FAQ"
      description=" "
      endpoint="/other/faq"
      emptyTitle="No faq available"
      emptyMessage=" "
      actions={[{ to: '/', label: 'Main page' }]}
    />
  );
}
