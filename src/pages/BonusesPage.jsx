import ContentPageTemplate from './ContentPageTemplate.jsx';
import './BonusesPage.css';

export default function BonusesPage() {
  return (
    <ContentPageTemplate
      eyebrow="Promotions"
      title="Bonuses"
      description="Welcome bonus is closed. Submit your account information first, then your first eligible deposit can receive a 100% bonus with 2x bonus turnover."
      endpoint="/bonuses"
      emptyTitle="No bonuses available"
      emptyMessage="Active bonus: first-deposit bonus after account information submission."
      actions={[{ to: '/', label: 'Main page' }]}
    />
  );
}
