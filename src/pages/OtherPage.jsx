import ContentPageTemplate from './ContentPageTemplate.jsx';
import './OtherPage.css';

export default function OtherPage() {
  return (
    <ContentPageTemplate
      eyebrow="Other"
      title="Other"
      description=" "
      endpoint="/other"
      emptyTitle="No other available"
      emptyMessage=" "
      actions={[{ to: '/', label: 'Main page' }]}
    />
  );
}
