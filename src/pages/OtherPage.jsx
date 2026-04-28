import ContentPageTemplate from './ContentPageTemplate.jsx';
import './OtherPage.css';

export default function OtherPage() {
  return (
    <ContentPageTemplate
      eyebrow="Other"
      title="Other"
      description="Other site content will load from the backend/admin panel."
      endpoint="/other"
      emptyTitle="No other available"
      emptyMessage="Add other content in the backend/admin panel to show it here."
      actions={[{ to: '/', label: 'Main page' }]}
    />
  );
}
