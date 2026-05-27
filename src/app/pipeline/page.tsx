"use client"

import * as React from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { 
  Building2, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Target,
  User,
  GripVertical,
  Calendar
} from "lucide-react"
import { BookingDialog } from "@/components/booking-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

const REAL_STATUSES = [
  "NEW",
  "ENRICHED",
  "CONTACTED",
  "FOLLOW_UP",
  "INTERESTED",
  "DISCOVERY_CALL_BOOKED",
  "PROPOSAL_SENT",
  "WON",
  "LOST",
]

export default function PipelinePage() {
  const [leads, setLeads] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedLead, setSelectedLead] = React.useState<any>(null)
  const [isBookingOpen, setIsBookingOpen] = React.useState(false)
  const [enabled, setEnabled] = React.useState(false)

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/leads')
      const data = await res.json()
      setLeads(data)
    } catch (err) {
      console.error('Error fetching leads:', err)
      toast.error('Failed to load pipeline')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    setEnabled(true)
    fetchLeads()
  }, [])

  if (!enabled) {
    return null
  }

  const filteredLeads = leads.filter(lead => 
    lead.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.industry.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    // Optimistic update
    const updatedLeads = [...leads]
    const leadIndex = updatedLeads.findIndex(l => l.id === draggableId)
    if (leadIndex !== -1) {
      const oldStatus = updatedLeads[leadIndex].status
      const newStatus = destination.droppableId
      
      updatedLeads[leadIndex] = {
        ...updatedLeads[leadIndex],
        status: newStatus
      }
      setLeads(updatedLeads)

      try {
        const res = await fetch(`/api/leads/${draggableId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
        if (!res.ok) throw new Error('Update failed')
      } catch (err) {
        console.error('Error updating status:', err)
        toast.error('Failed to update lead status')
        // Rollback
        updatedLeads[leadIndex].status = oldStatus
        setLeads([...updatedLeads])
      }
    }
  }

  const getLeadsByStatus = (status: string) => {
    return filteredLeads.filter(lead => lead.status === status)
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">CRM Pipeline</h2>
          <p className="text-muted-foreground">
            Manage your sales process and track lead conversions.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pipeline..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button><Plus className="h-4 w-4 mr-2" /> Add Lead</Button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 h-full min-w-max">
            {REAL_STATUSES.map((status) => (
              <div key={status} className="w-80 flex flex-col bg-muted/30 rounded-lg border">
                <div className="p-3 border-b flex justify-between items-center bg-background/50 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[10px] uppercase tracking-wider">{status.replace(/_/g, ' ')}</h3>
                    <Badge variant="secondary" className="text-[10px]">
                      {getLeadsByStatus(status).length}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>

                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 p-2 space-y-2 transition-colors overflow-y-auto ${
                        snapshot.isDraggingOver ? "bg-secondary/5" : ""
                      }`}
                    >
                      {loading ? (
                        <div className="text-center py-4 text-[10px] text-muted-foreground italic">Loading...</div>
                      ) : (
                        getLeadsByStatus(status).map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`shadow-sm cursor-default hover:border-secondary/50 transition-all ${
                                  snapshot.isDragging ? "rotate-2 shadow-lg ring-1 ring-secondary/20" : ""
                                }`}
                              >
                                <CardHeader className="p-3 pb-0 space-y-0">
                                  <div className="flex justify-between items-start gap-2">
                                    <div className="font-semibold text-xs truncate flex-1">
                                      {lead.companyName}
                                    </div>
                                    <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground">
                                      <GripVertical className="h-3 w-3" />
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="p-3 pt-2 space-y-3">
                                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                    <Building2 className="h-3 w-3" />
                                    {lead.industry || 'Unknown'}
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1 text-[10px] font-medium">
                                      <Target className="h-3 w-3 text-secondary" />
                                      {lead.score}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                      <User className="h-3 w-3" />
                                      {lead.decisionMakerName ? lead.decisionMakerName.split(" ")[0] : 'None'}
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {lead.relevantIsoNeed && (
                                      <Badge variant="outline" className="text-[9px] py-0 h-4 border-secondary/20 bg-secondary/5">
                                        {lead.relevantIsoNeed}
                                      </Badge>
                                    )}
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full text-[10px] h-7 gap-1 mt-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedLead(lead);
                                      setIsBookingOpen(true);
                                    }}
                                  >
                                    <Calendar className="h-3 w-3" />
                                    Book Call
                                  </Button>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
      <BookingDialog 
        lead={selectedLead}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={fetchLeads}
      />
    </div>
  )
}
