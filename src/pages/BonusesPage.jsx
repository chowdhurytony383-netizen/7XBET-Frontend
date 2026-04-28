import ContentPageTemplate from './ContentPageTemplate.jsx';
import './BonusesPage.css';

export default function BonusesPage() {
  return (
    <ContentPageTemplate
      eyebrow="Promotions"
      title="Bonuses"
      description="Available bonuses, rules and eligibility will load from the backend."
      endpoint="/bonuses"
      emptyTitle="No bonuses available"
      emptyMessage="Add bonuses content in the backend/admin panel to show it here."
      actions={[{ to: '/', label: 'Main page' }]}
    />
  );
}
