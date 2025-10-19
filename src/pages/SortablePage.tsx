import { SortableScrollList } from "@/components/sortable"

export default function SortablePage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Test du composant Sortable</h1>
        <SortableScrollList />
      </div>
    </div>
  )
}
