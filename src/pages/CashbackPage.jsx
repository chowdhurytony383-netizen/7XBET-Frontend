import ContentPageTemplate from './ContentPageTemplate.jsx';
import './CashbackPage.css';

export default function CashbackPage() {
  return (
    <ContentPageTemplate
      eyebrow="Promotions"
      title="Cashback"
      description="Cashback offers and rules will load from the backend."
      endpoint="/bonuses/cashback"
      emptyTitle="No cashback available"
      emptyMessage="Add cashback content in the backend/admin panel to show it here."
      actions={[{ to: '/', label: 'Main page' }]}
    />
  );
}
