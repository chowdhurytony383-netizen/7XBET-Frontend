import ContentPageTemplate from './ContentPageTemplate.jsx';
import './BonusesPage.css';

export default function BonusesPage() {
  return (
    <ContentPageTemplate
      eyebrow="Promotions"
      title="Bonuses"
      description=" "
      endpoint="/bonuses"
      emptyTitle="No bonuses available"
      emptyMessage=" "
      actions={[{ to: '/', label: 'Main page' }]}
    />
  );
}
