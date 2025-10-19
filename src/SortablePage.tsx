import { SortableScrollList } from "@/components/sortable"

export default function SortablePage() {
  return (
    <div className="p-10">
      <h1 className="text-xl font-bold mb-4">Page de test triable</h1>
      <SortableScrollList />
    </div>
  )
}
