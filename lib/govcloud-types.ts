// Government Cloud Research — TypeScript types for the Next.js data layer.
// Load tables from /public/data/tables/*.json and pre-shaped charts from /public/data/charts/*.json.
export type Tier = 'A' | 'B' | 'C';
export type Track = 'A' | 'B' | 'C' | 'D' | 'E'; // law | release | deploy/enforce | litigation | investment

export interface Geography { id: string; name: string; region: string; tier: number }
export interface Vendor { id: string; name: string; hq_country: string; vendor_class: 'hyperscaler'|'local'|'isv' }
export interface Domain { id: string; name: string; domain_class: 'established'|'emerging' }
export interface Source { id: string; url: string; title: string; publisher: string; published_on: string; evidence_tier: Tier; archived_url: string; local_copy: string }
export interface Deployment { id: string; geography_id: string; vendor_id: string; domain_id: string; workload: string; status: string; accreditation: string; adoption_stage: string; maturity_score: number|null; trl: number|null; source_id: string }
export interface Award { id: string; geography_id: string; vendor_id: string; buyer: string; vehicle: string; scope: string; value_usd: number|null; value_basis: string; awarded_on: string; ends_on: string; recompete_on: string; funding_statute: string; emergency: boolean; source_id: string }
export interface Regulation { id: string; geography_id: string; instrument: string; instrument_type: string; status: string; enacted_on: string; applies_from: string; domains_affected: string; neural_data: boolean; localisation: boolean; source_id: string }
export interface Milestone { id: string; occurred_on: string; track: Track; geography_id: string; vendor_id: string|null; domain_id: string; title: string; description: string; relationship: string|null; lag_days: number|null; date_certainty: 'fixed'|'projected'|'contested'; source_id: string }
export interface Investment { id: string; domain_id: string; geography_id: string|null; kind: 'market-size'|'capital-flow'|'thesis'; headline: string; value_usd: number|null; period: string; investor: string; note: string; confidence: 'low'|'moderate'|'high'; source_id: string }
export interface Litigation { id: string; case_name: string; parties: string; jurisdiction: string; court: string; claim: string; status: string; outcome: string; filed_on: string; decided_on: string; vendor_id: string|null; domain_id: string|null; geography_id: string; category: 'gov-cloud'|'organized-harassment'; actor_type: string; source_id: string }
export interface Capability { id: string; vendor_id: string|null; platform: string; capability: string; category: string; description: string; mission_use: string; source_id: string }

// chart shapes
export interface TimelinePoint { date: string; year: number; track: Track; geo: string; vendor: string|null; domain: string; title: string; relationship: string|null; certainty: string; tier: Tier }
export interface SankeyNode { id: number; label: string; kind: 'statute'|'vendor'|'geography' }
export interface SankeyLink { source: number; target: number; value: number }
export interface Sankey { nodes: SankeyNode[]; links: SankeyLink[] }
