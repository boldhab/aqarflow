import { Suspense } from 'react';
import { WorkflowPage } from '@/modules/workspace/components/WorkflowPage';
export default function Page() { return <Suspense fallback={<p role="status">Loading…</p>}><WorkflowPage kind="deals"/></Suspense>; }
