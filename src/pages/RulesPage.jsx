import ContentPageTemplate from './ContentPageTemplate.jsx';
import './RulesPage.css';

export default function RulesPage() {
  return (
    <ContentPageTemplate
      eyebrow="Rules"
      title="Rules"
      description="Platform rules and game rules will load from the backend/admin panel."
      endpoint="/other/rules"
      emptyTitle="No rules available"
      emptyMessage="Add rules content in the backend/admin panel to show it here."
      actions={[{ to: '/', label: 'Main page' }]}
    />
  );
}
