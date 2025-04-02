import { useState, useEffect, useCallback } from 'react';

export interface TableColumnVisibility {
  [columnId: string]: boolean;
}

export interface TableColumnOrder {
  columnIds: string[];
}

export interface TableSortState {
  column: string | null;
  direction: 'asc' | 'desc';
}

export interface TableFilterState {
  [columnId: string]: any;
}

export interface TableView {
  id: string;
  name: string;
  columnVisibility: TableColumnVisibility;
  columnOrder: TableColumnOrder;
  sortState: TableSortState;
  filterState: TableFilterState;
  searchQuery?: string;
  dateFilter?: string;
  customDateRange?: {
    from?: string;
    to?: string;
  };
  createdAt: string;
  lastUsed: string;
}

export interface TableConfig {
  currentViewId: string | null;
  views: TableView[];
  defaultColumns: string[];
}

interface UseTableConfigOptions {
  tableId: string;
  defaultColumns: string[];
  defaultColumnVisibility?: TableColumnVisibility;
  onSaveToDatabase?: (config: TableConfig) => Promise<void>;
  onLoadFromDatabase?: () => Promise<TableConfig | null>;
}

export function useTableConfig({
  tableId,
  defaultColumns,
  defaultColumnVisibility,
  onSaveToDatabase,
  onLoadFromDatabase
}: UseTableConfigOptions) {
  // Store the complete table configuration
  const [config, setConfig] = useState<TableConfig>({
    currentViewId: null,
    views: [],
    defaultColumns
  });
  
  // Current view state for easier access
  const [currentView, setCurrentView] = useState<TableView | null>(null);

  // Individual state pieces for components to use directly
  const [columnVisibility, setColumnVisibility] = useState<TableColumnVisibility>(
    defaultColumnVisibility || Object.fromEntries(defaultColumns.map(col => [col, true]))
  );
  
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumns);
  
  const [sortState, setSortState] = useState<TableSortState>({
    column: null,
    direction: 'asc'
  });
  
  const [filterState, setFilterState] = useState<TableFilterState>({});
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [dateFilter, setDateFilter] = useState<string>('last30');
  
  const [customDateRange, setCustomDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({});

  // Load config from localStorage on initial mount
  useEffect(() => {
    const loadConfig = async () => {
      let loadedConfig: TableConfig | null = null;
      
      // Try to load from database first (if provided)
      if (onLoadFromDatabase) {
        try {
          loadedConfig = await onLoadFromDatabase();
        } catch (error) {
          console.error('Failed to load table config from database:', error);
        }
      }
      
      // If no database config, try localStorage
      if (!loadedConfig && typeof window !== 'undefined') {
        const savedConfig = localStorage.getItem(`table-config-${tableId}`);
        if (savedConfig) {
          try {
            loadedConfig = JSON.parse(savedConfig);
          } catch (e) {
            console.error('Failed to parse saved table config', e);
          }
        }
      }
      
      // If we have a loaded config, set it
      if (loadedConfig) {
        setConfig(loadedConfig);
        
        // Set the current view if there is one
        if (loadedConfig.currentViewId) {
          const view = loadedConfig.views.find(v => v.id === loadedConfig.currentViewId);
          if (view) {
            setCurrentView(view);
            applyView(view);
          }
        }
      }
    };
    
    loadConfig();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId, onLoadFromDatabase]);
  
  // Save config to localStorage whenever it changes
  useEffect(() => {
    const saveConfig = async () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`table-config-${tableId}`, JSON.stringify(config));
      }
      
      // Also save to database if handler provided
      if (onSaveToDatabase) {
        try {
          await onSaveToDatabase(config);
        } catch (error) {
          console.error('Failed to save table config to database:', error);
        }
      }
    };
    
    saveConfig();
  }, [config, tableId, onSaveToDatabase]);
  
  // Create a new view with current state
  const createView = useCallback((name: string) => {
    const newView: TableView = {
      id: `view-${Date.now()}`,
      name,
      columnVisibility,
      columnOrder: { columnIds: columnOrder },
      sortState,
      filterState,
      searchQuery,
      dateFilter,
      customDateRange: {
        from: customDateRange.from?.toISOString(),
        to: customDateRange.to?.toISOString(),
      },
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };
    
    setConfig(prev => ({
      ...prev,
      currentViewId: newView.id,
      views: [...prev.views, newView]
    }));
    
    setCurrentView(newView);
    
    return newView;
  }, [columnVisibility, columnOrder, sortState, filterState, searchQuery, dateFilter, customDateRange]);
  
  // Update an existing view
  const updateView = useCallback((viewId: string) => {
    if (!viewId) return;
    
    setConfig(prev => {
      const updatedView: TableView = {
        id: viewId,
        name: prev.views.find(v => v.id === viewId)?.name || 'Unnamed View',
        columnVisibility,
        columnOrder: { columnIds: columnOrder },
        sortState,
        filterState,
        searchQuery,
        dateFilter,
        customDateRange: {
          from: customDateRange.from?.toISOString(),
          to: customDateRange.to?.toISOString(),
        },
        createdAt: prev.views.find(v => v.id === viewId)?.createdAt || new Date().toISOString(),
        lastUsed: new Date().toISOString()
      };
      
      return {
        ...prev,
        views: prev.views.map(v => v.id === viewId ? updatedView : v)
      };
    });
  }, [columnVisibility, columnOrder, sortState, filterState, searchQuery, dateFilter, customDateRange]);
  
  // Apply a view
  const applyView = useCallback((view: TableView) => {
    setColumnVisibility(view.columnVisibility);
    setColumnOrder(view.columnOrder.columnIds);
    setSortState(view.sortState);
    setFilterState(view.filterState);
    
    if (view.searchQuery !== undefined) {
      setSearchQuery(view.searchQuery);
    }
    
    if (view.dateFilter !== undefined) {
      setDateFilter(view.dateFilter);
    }
    
    if (view.customDateRange) {
      setCustomDateRange({
        from: view.customDateRange.from ? new Date(view.customDateRange.from) : undefined,
        to: view.customDateRange.to ? new Date(view.customDateRange.to) : undefined
      });
    }
    
    // Update the last used timestamp
    setConfig(prev => ({
      ...prev,
      currentViewId: view.id,
      views: prev.views.map(v => 
        v.id === view.id 
          ? { ...v, lastUsed: new Date().toISOString() } 
          : v
      )
    }));
    
    setCurrentView(view);
  }, []);
  
  // Delete a view
  const deleteView = useCallback((viewId: string) => {
    setConfig(prev => {
      // Determine new current view if we're deleting the current one
      let newCurrentViewId = prev.currentViewId;
      if (newCurrentViewId === viewId) {
        newCurrentViewId = prev.views.length > 1 
          ? prev.views.find(v => v.id !== viewId)?.id || null
          : null;
      }
      
      // If we're removing the last view, reset current state
      if (prev.views.length === 1 && prev.views[0].id === viewId) {
        setColumnVisibility(defaultColumnVisibility || Object.fromEntries(defaultColumns.map(col => [col, true])));
        setColumnOrder(defaultColumns);
        setSortState({ column: null, direction: 'asc' });
        setFilterState({});
        setSearchQuery('');
        setDateFilter('last30');
        setCustomDateRange({});
        setCurrentView(null);
      } 
      // Otherwise set the new current view
      else if (newCurrentViewId !== prev.currentViewId) {
        const newCurrentView = prev.views.find(v => v.id === newCurrentViewId);
        if (newCurrentView) {
          applyView(newCurrentView);
        }
      }
      
      return {
        ...prev,
        currentViewId: newCurrentViewId,
        views: prev.views.filter(v => v.id !== viewId)
      };
    });
  }, [applyView, defaultColumnVisibility, defaultColumns]);
  
  // Rename a view
  const renameView = useCallback((viewId: string, newName: string) => {
    setConfig(prev => ({
      ...prev,
      views: prev.views.map(v => 
        v.id === viewId 
          ? { ...v, name: newName } 
          : v
      )
    }));
  }, []);
  
  // Export current view as a serializable object
  const exportCurrentView = useCallback(() => {
    return {
      columnVisibility,
      columnOrder: { columnIds: columnOrder },
      sortState,
      filterState,
      searchQuery,
      dateFilter,
      customDateRange: {
        from: customDateRange.from?.toISOString(),
        to: customDateRange.to?.toISOString(),
      }
    };
  }, [columnVisibility, columnOrder, sortState, filterState, searchQuery, dateFilter, customDateRange]);

  // Handle individual state updates and sync with current view
  const handleColumnVisibilityChange = useCallback((newVisibility: TableColumnVisibility) => {
    setColumnVisibility(newVisibility);
    
    // Update current view if there is one
    if (config.currentViewId) {
      updateView(config.currentViewId);
    }
  }, [config.currentViewId, updateView]);
  
  const handleColumnOrderChange = useCallback((newOrder: string[]) => {
    setColumnOrder(newOrder);
    
    // Update current view if there is one
    if (config.currentViewId) {
      updateView(config.currentViewId);
    }
  }, [config.currentViewId, updateView]);
  
  const handleSortStateChange = useCallback((newSortState: TableSortState) => {
    setSortState(newSortState);
    
    // Update current view if there is one
    if (config.currentViewId) {
      updateView(config.currentViewId);
    }
  }, [config.currentViewId, updateView]);
  
  const handleFilterStateChange = useCallback((newFilterState: TableFilterState) => {
    setFilterState(newFilterState);
    
    // Update current view if there is one
    if (config.currentViewId) {
      updateView(config.currentViewId);
    }
  }, [config.currentViewId, updateView]);
  
  const handleSearchQueryChange = useCallback((newQuery: string) => {
    console.log("Setting search query in hook:", newQuery);
    setSearchQuery(newQuery);
    
    // Update current view if there is one
    if (config.currentViewId) {
      updateView(config.currentViewId);
    }
  }, [config.currentViewId, updateView]);
  
  const handleDateFilterChange = useCallback((newFilter: string) => {
    setDateFilter(newFilter);
    
    // Update current view if there is one
    if (config.currentViewId) {
      updateView(config.currentViewId);
    }
  }, [config.currentViewId, updateView]);
  
  const handleCustomDateRangeChange = useCallback((newRange: { from?: Date; to?: Date }) => {
    setCustomDateRange(newRange);
    
    // Update current view if there is one
    if (config.currentViewId) {
      updateView(config.currentViewId);
    }
  }, [config.currentViewId, updateView]);
  
  const resetToDefault = useCallback(() => {
    setColumnVisibility(defaultColumnVisibility || Object.fromEntries(defaultColumns.map(col => [col, true])));
    setColumnOrder(defaultColumns);
    setSortState({ column: null, direction: 'asc' });
    setFilterState({});
    setSearchQuery('');
    setDateFilter('last30');
    setCustomDateRange({});
    
    // Clear current view
    setConfig(prev => ({
      ...prev,
      currentViewId: null
    }));
    
    setCurrentView(null);
  }, [defaultColumnVisibility, defaultColumns]);

  return {
    // View management
    views: config.views,
    currentView,
    createView,
    applyView,
    updateView,
    deleteView,
    renameView,
    resetToDefault,
    exportCurrentView,
    
    // Individual state pieces
    columnVisibility,
    setColumnVisibility: handleColumnVisibilityChange,
    columnOrder,
    setColumnOrder: handleColumnOrderChange,
    sortState,
    setSortState: handleSortStateChange,
    filterState,
    setFilterState: handleFilterStateChange,
    searchQuery,
    setSearchQuery: handleSearchQueryChange,
    dateFilter,
    setDateFilter: handleDateFilterChange,
    customDateRange,
    setCustomDateRange: handleCustomDateRangeChange
  };
} 