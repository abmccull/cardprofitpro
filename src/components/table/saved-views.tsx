import { useState } from 'react';
import { Button } from '@/components/ui-migrated/button';
import { Input } from '@/components/ui-migrated/input';
import { Label } from '@/components/ui-migrated/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui-migrated/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui-migrated/dialog';
import { TableView } from '@/hooks/useTableConfig';
import { 
  Bookmark, 
  Check, 
  ChevronDown, 
  Edit, 
  Eye, 
  Inbox, 
  Plus, 
  Save, 
  Trash, 
  X 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui-migrated/scroll-area';
import { useToast } from '@/components/ui-migrated/use-toast';

interface SavedViewsProps {
  views: TableView[];
  currentView: TableView | null;
  onCreateView: (name: string) => void;
  onApplyView: (view: TableView) => void;
  onUpdateView: (viewId: string) => void;
  onDeleteView: (viewId: string) => void;
  onRenameView: (viewId: string, newName: string) => void;
}

export function SavedViews({
  views,
  currentView,
  onCreateView,
  onApplyView,
  onUpdateView,
  onDeleteView,
  onRenameView
}: SavedViewsProps) {
  const { toast } = useToast();
  const [newViewName, setNewViewName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingView, setEditingView] = useState<TableView | null>(null);

  // Create a new view
  const handleCreateView = () => {
    if (!newViewName.trim()) {
      toast({
        variant: "destructive",
        title: "Name required",
        description: "Please enter a name for your saved view."
      });
      return;
    }

    onCreateView(newViewName.trim());
    setNewViewName('');
    setIsCreateDialogOpen(false);
    
    toast({
      title: "View saved",
      description: `"${newViewName.trim()}" view has been created.`
    });
  };

  // Update the current view
  const handleUpdateCurrentView = () => {
    if (currentView) {
      onUpdateView(currentView.id);
      
      toast({
        title: "View updated",
        description: `"${currentView.name}" has been updated with current settings.`
      });
    }
  };

  // Rename a view
  const handleRenameView = () => {
    if (editingView && newViewName.trim()) {
      onRenameView(editingView.id, newViewName.trim());
      setEditingView(null);
      setNewViewName('');
      
      toast({
        title: "View renamed",
        description: `View has been renamed to "${newViewName.trim()}".`
      });
    }
  };

  // Delete a view with confirmation
  const handleDeleteView = (view: TableView) => {
    if (confirm(`Are you sure you want to delete the "${view.name}" view?`)) {
      onDeleteView(view.id);
      
      toast({
        title: "View deleted",
        description: `"${view.name}" has been deleted.`
      });
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Quick access view buttons */}
      <div className="flex items-center overflow-x-auto gap-1 flex-nowrap max-w-[500px] mr-1">
        {views.slice(0, 5).map((view) => (
          <Button
            key={view.id}
            variant={currentView?.id === view.id ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-8 whitespace-nowrap rounded-full border",
              currentView?.id === view.id 
                ? "bg-sports-blue text-white hover:bg-sports-blue/90" 
                : "border-foil-silver text-neutral-gray hover:text-sports-blue hover:border-sports-blue"
            )}
            onClick={() => onApplyView(view)}
          >
            {view.name}
          </Button>
        ))}
      </div>
      
      {/* Saved Views Dropdown */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 border-2 border-foil-silver hover:border-sports-blue rounded-full shadow-sm hover:shadow-button-hover flex items-center gap-1"
          >
            <Bookmark className="h-4 w-4 text-sports-blue" />
            <span className="text-sports-blue">Views</span>
            {views.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sports-blue text-[0.625rem] font-medium text-white">
                {views.length}
              </span>
            )}
            <ChevronDown className="h-3 w-3 text-sports-blue" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="end">
          <div className="p-3 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Saved Views</h3>
              <div className="flex items-center gap-1">
                {currentView && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={handleUpdateCurrentView}
                    title="Update current view"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    <span>Update</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  <span>New View</span>
                </Button>
              </div>
            </div>
            
            {/* Current view info */}
            {currentView && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                <div className="text-xs text-muted-foreground">Current View</div>
                <div className="font-medium text-sm flex items-center gap-1">
                  <Eye className="h-3 w-3 text-sports-blue" />
                  {currentView.name}
                </div>
              </div>
            )}
          </div>
          
          {/* Views list */}
          {views.length > 0 ? (
            <ScrollArea className="max-h-[280px]">
              <div className="p-2">
                {views.map((view) => (
                  <div 
                    key={view.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md hover:bg-accent group",
                      currentView?.id === view.id && "bg-accent/50"
                    )}
                  >
                    <button 
                      className="flex items-center gap-2 text-left flex-1"
                      onClick={() => onApplyView(view)}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {view.name}
                          {currentView?.id === view.id && (
                            <Check className="h-3 w-3 text-green-500 inline ml-1" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last used: {formatDate(view.lastUsed)}
                        </div>
                      </div>
                    </button>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          setEditingView(view);
                          setNewViewName(view.name);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-sports-red hover:text-sports-red/80 hover:bg-red-50"
                        onClick={() => handleDeleteView(view)}
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="py-6 px-4 text-center">
              <Inbox className="h-8 w-8 mx-auto text-gray-400" />
              <div className="mt-2 text-sm font-medium">No saved views</div>
              <div className="text-xs text-muted-foreground mt-1">
                Save your current table configuration as a view to quickly access it later.
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                <span>Create View</span>
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
      
      {/* Create View Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Save Current View</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="viewName" className="mb-2 block">View Name</Label>
            <Input
              id="viewName"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="e.g. Recent Acquisitions, High Value Cards, etc."
              className="w-full"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleCreateView}>
              <Plus className="h-4 w-4 mr-1" />
              Save View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Rename View Dialog */}
      <Dialog open={!!editingView} onOpenChange={(open) => !open && setEditingView(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Rename View</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="editViewName" className="mb-2 block">New Name</Label>
            <Input
              id="editViewName"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              className="w-full"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingView(null)}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleRenameView}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 