import ContentPageTemplate from './ContentPageTemplate.jsx';
import './BetSlipPage.css';

export default function BetSlipPage() {
  return (
    <ContentPageTemplate
      eyebrow="Bet slip"
      title="Bet slip"
      description="Selected bets and active bet slip details will load after backend integration."
      endpoint="/bets/slip"
      emptyTitle="No bet slip available"
      emptyMessage="Add bet slip content in the backend/admin panel to show it here."
      actions={[{ to: '/', label: 'Main page' }]}
    />
  );
}
