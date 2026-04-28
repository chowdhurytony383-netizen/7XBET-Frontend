import ContentPageTemplate from './ContentPageTemplate.jsx';
import './CrashPage.css';

export default function CrashPage() {
  return (
    <ContentPageTemplate
      eyebrow="Games"
      title="Crash"
      description="Crash game content and configuration will load from the backend."
      endpoint="/games/crash"
      emptyTitle="No crash available"
      emptyMessage="Add crash content in the backend/admin panel to show it here."
      actions={[{ to: '/', label: 'Main page' }]}
    />
  );
}
