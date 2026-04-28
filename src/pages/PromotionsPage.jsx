import ContentPageTemplate from './ContentPageTemplate.jsx';
import './PromotionsPage.css';

export default function PromotionsPage() {
  return (
    <ContentPageTemplate
      eyebrow="Other"
      title="Promotions"
      description="Promotions will load from the backend/admin panel."
      endpoint="/other/promotions"
      emptyTitle="No promotions available"
      emptyMessage="Add promotions content in the backend/admin panel to show it here."
      actions={[{ to: '/', label: 'Main page' }]}
    />
  );
}
