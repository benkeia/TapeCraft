import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ChevronsUpDown, X, Upload, Music } from "lucide-react"
import { useState, useRef } from "react"

interface SortableItemProps {
  id: string
  title: string
  duration: string
  onRemove: (id: string) => void
  isRemoving?: boolean
}

interface PlaylistItem {
  id: string
  title: string
  duration: string
}

// Fonction pour tronquer le texte basé sur l'espace disponible
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + "..."
}

function SortableItem({ id, title, duration, onRemove, isRemoving }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transition: isRemoving ? "opacity 0.3s ease-out, transform 0.3s ease-out" : transition,
    opacity: isDragging ? 0.5 : isRemoving ? 0 : 1,
    transform: isRemoving ? "scale(0.95)" : CSS.Transform.toString(transform),
  }

  const maxTitleLength = Math.floor((240 / 8))

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex justify-between items-center py-3 bg-background group"
      role="listitem"
      aria-label={`${title}, durée ${duration}`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-xs text-muted-foreground w-12 flex-shrink-0 text-right" aria-label={`Durée: ${duration}`}>
          {duration}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate pr-2" title={title}>
            {truncateText(title, maxTitleLength)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0" role="group" aria-label="Actions pour cette piste">
        <Button
          variant="ghost"
          size="icon"
          {...attributes}
          {...listeners}
          className="cursor-grab hover:bg-muted h-8 w-8 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 transition-opacity"
          aria-label={`Réorganiser ${title}`}
          aria-describedby={`drag-instructions-${id}`}
        >
          <ChevronsUpDown className="w-4 h-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(id)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 transition-opacity"
          aria-label={`Supprimer ${title} de la playlist`}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </Button>
        <div id={`drag-instructions-${id}`} className="sr-only">
          Utilisez les flèches pour réorganiser ou Espace/Entrée pour activer le drag
        </div>
      </div>
    </div>
  )
}

// Fonction pour obtenir la durée d'un fichier audio
const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const audio = new Audio()
    const url = URL.createObjectURL(file)
    
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url)
      resolve(audio.duration || 0)
    })
    
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url)
      resolve(0)
    })
    
    audio.src = url
  })
}

// Fonction pour formater le temps en minutes:secondes
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function SortableScrollList() {
  const [items, setItems] = useState<PlaylistItem[]>([])
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    setActiveId(null)
    
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over?.id)
      setItems((items) => arrayMove(items, oldIndex, newIndex))
    }
  }

  const handleRemove = (id: string) => {
    setRemovingItems(prev => new Set([...prev, id]))
    setTimeout(() => {
      setItems((items) => items.filter((item) => item.id !== id))
      setRemovingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }, 300)
  }

  const handleFileUpload = async (files: File[]) => {
    setIsUploading(true)
    
    const audioFiles = files.filter(file => file.type.startsWith('audio/'))
    
    for (const file of audioFiles) {
      const id = crypto.randomUUID()
      const fileName = file.name.replace(/\.[^/.]+$/, "") // Supprimer l'extension
      
      // Ajouter immédiatement l'item avec durée "Calcul..."
      const newItem: PlaylistItem = {
        id,
        title: fileName,
        duration: "Calcul..."
      }
      
      setItems(prev => [...prev, newItem])
      
      // Calculer la durée en arrière-plan
      try {
        const duration = await getAudioDuration(file)
        setItems(prev => 
          prev.map(item => 
            item.id === id 
              ? { ...item, duration: formatTime(duration) }
              : item
          )
        )
      } catch (error) {
        console.error('Erreur lors du calcul de la durée:', error)
        setItems(prev => 
          prev.map(item => 
            item.id === id 
              ? { ...item, duration: "0:00" }
              : item
          )
        )
      }
    }
    
    setIsUploading(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    
    // Vérifier qu'il y a des fichiers audio
    const audioFiles = files.filter(file => file.type.startsWith('audio/'))
    if (audioFiles.length > 0) {
      handleFileUpload(files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    // Vérifier que l'on sort vraiment de la zone (pas juste un enfant)
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      handleFileUpload(files)
    }
  }

  const activeItem = items.find(item => item.id === activeId)

  const totalDuration = items.reduce((total, item) => {
    if (item.duration === "Calcul...") return total
    const [mins, secs] = item.duration.split(':').map(Number)
    return total + (mins * 60) + secs
  }, 0)

  const formattedTotalDuration = formatTime(totalDuration)

  return (
    <div className="w-full max-w-none mx-auto">
      {/* Zone d'import de fichiers */}
      <div 
        className={`mb-3 p-4 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer ${
          isDragOver 
            ? 'border-primary bg-primary/20 border-solid' 
            : isUploading 
              ? 'border-muted-foreground/50 bg-muted/30' 
              : 'border-muted-foreground/25 bg-muted/20 hover:bg-muted/30 hover:border-muted-foreground/40'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Zone d'import de fichiers audio"
        aria-describedby="upload-instructions"
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !isUploading) {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
      >
        <div className="text-center">
          <Upload 
            className={`mx-auto h-6 w-6 mb-2 transition-colors ${
              isDragOver ? 'text-primary' : 'text-muted-foreground'
            }`} 
            aria-hidden="true" 
          />
          <p className={`text-xs font-medium mb-1 transition-colors ${
            isDragOver ? 'text-primary' : ''
          }`}>
            {isUploading 
              ? "Import en cours..." 
              : isDragOver 
                ? "Relâchez pour importer" 
                : "Importer des fichiers audio"
            }
          </p>
          <p className="text-xs text-muted-foreground" id="upload-instructions">
            {isDragOver 
              ? "Fichiers audio détectés" 
              : "Glissez vos fichiers MP3, WAV, FLAC, M4A ici ou cliquez"
            }
          </p>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*,.flac"
          onChange={handleFileInputChange}
          className="sr-only"
          aria-label="Sélectionner des fichiers audio à importer"
          disabled={isUploading}
        />
      </div>

      {items.length === 0 && !isUploading && (
        <div className="text-center py-6 text-muted-foreground" role="status" aria-live="polite">
          <Music className="mx-auto h-8 w-8 mb-2" aria-hidden="true" />
          <p className="text-xs">Aucune musique importée</p>
        </div>
      )}

      {items.length > 0 && (
        <>
          <div className="mb-2 text-xs text-muted-foreground" aria-live="polite">
            {items.length} piste{items.length > 1 ? 's' : ''} • Durée: {formattedTotalDuration}
          </div>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
            accessibility={{
              announcements: {
                onDragStart({ active }) {
                  const item = items.find(i => i.id === active.id)
                  return `Déplacement de ${item?.title} commencé`
                },
                onDragOver({ active, over }) {
                  const item = items.find(i => i.id === active.id)
                  const overItem = items.find(i => i.id === over?.id)
                  return `${item?.title} au-dessus de ${overItem?.title}`
                },
                onDragEnd({ active, over }) {
                  const item = items.find(i => i.id === active.id)
                  const overItem = items.find(i => i.id === over?.id)
                  if (over?.id) {
                    return `${item?.title} déplacé vers ${overItem?.title}`
                  }
                  return `Déplacement de ${item?.title} annulé`
                },
                onDragCancel({ active }) {
                  const item = items.find(i => i.id === active.id)
                  return `Déplacement de ${item?.title} annulé`
                },
              },
            }}
          >
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="relative">
                <ScrollArea 
                  className="h-48 w-full bg-background rounded-md [&>div>div[style]]:!pr-0"
                  role="region"
                  aria-label="Liste des pistes de musique"
                >
                  <ul 
                    className="p-2 pr-4 max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-muted scrollbar-thumb-muted-foreground hover:scrollbar-thumb-foreground"
                    role="list"
                    aria-label={`Playlist avec ${items.length} piste${items.length > 1 ? 's' : ''}`}
                  >
                    {items.map((item, index) => (
                      <li key={item.id}>
                        <SortableItem
                          id={item.id}
                          title={item.title}
                          duration={item.duration}
                          onRemove={handleRemove}
                          isRemoving={removingItems.has(item.id)}
                        />
                        {index < items.length - 1 && (
                          <Separator className="h-px bg-border" aria-hidden="true" />
                        )}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
                
                {/* Dégradé en bas */}
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-10" aria-hidden="true" />
              </div>
            </SortableContext>
            
            <DragOverlay>
              {activeItem && (
                <div 
                  className="flex justify-between items-center py-3 px-4 bg-background/95 backdrop-blur-xl border rounded-md shadow-xl"
                  role="img"
                  aria-label={`Déplacement de ${activeItem.title}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground w-12 flex-shrink-0 text-right">
                      {activeItem.duration}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate pr-2">
                        {activeItem.title}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </>
      )}
      
      {/* Instructions d'accessibilité cachées */}
      <div className="sr-only" aria-live="polite" id="accessibility-instructions">
        Utilisez Tab pour naviguer entre les éléments. 
        Utilisez les flèches ou Espace pour réorganiser les pistes. 
        Utilisez Entrée pour activer les boutons.
      </div>
    </div>
  )
}