import { GraphinContext } from '@antv/graphin';
import * as React from 'react';

export interface Redo {
  visible: boolean;
  color: string;
  hasDivider: boolean;
}

const useRedoUndo = () => {
  const { graph } = React.useContext(GraphinContext);
  const [btnDisable, setBtnDisable] = React.useState({
    undo: true,
    redo: true,
  });
  const handleRedo = () => {
    if (btnDisable.redo) {
      return;
    }
    redo();
  };
  const handleUndo = () => {
    if (btnDisable.undo) {
      return;
    }
    undo();
  };
  const redo = () => {
    const redoStack = graph.getRedoStack();

    if (!redoStack || redoStack.length === 0) {
      return;
    }

    const currentData = redoStack.pop();
    if (currentData) {
      const { action } = currentData;
      let data = currentData.data.after;
      graph.pushStack(action, { ...currentData.data });
      if (action === 'delete') {
        data = currentData.data.before;
      }
      update(action, data);
    }
  };
  const undo = () => {
    const undoStack = graph.getUndoStack();

    if (!undoStack || undoStack.length === 1) {
      return;
    }

    const currentData = undoStack.pop();
    if (currentData) {
      const { action } = currentData;

      graph.pushStack(action, { ...currentData.data }, 'redo');
      let data = currentData.data.before;

      if (action === 'add') {
        data = currentData.data.after;
      }
      update(action, data);
    }
  };
  const update = (action, data) => {
    if (!data) return;

    switch (action) {
      case 'visible': {
        Object.keys(data).forEach(key => {
          const array = data[key];
          if (!array) return;
          array.forEach(model => {
            const item = graph.findById(model.id);
            if (model.visible) {
              graph.showItem(item, false);
            } else {
              graph.hideItem(item, false);
            }
          });
        });
        break;
      }
      case 'render':
      case 'update':
        Object.keys(data).forEach(key => {
          const array = data[key];
          if (!array) return;
          array.forEach(model => {
            graph.updateItem(model.id, model, false);
          });
        });
        break;
      case 'changedata':
        graph.changeData(data, false);
        break;
      case 'delete': {
        Object.keys(data).forEach(key => {
          const array = data[key];
          if (!array) return;
          array.forEach(model => {
            const itemType = model.itemType;
            delete model.itemType;
            graph.addItem(itemType, model, false);
          });
        });
        break;
      }
      case 'add':
        Object.keys(data).forEach(key => {
          const array = data[key];
          if (!array) return;
          array.forEach(model => {
            graph.removeItem(model.id, false);
          });
        });
        break;
      case 'updateComboTree':
        Object.keys(data).forEach(key => {
          const array = data[key];
          if (!array) return;
          array.forEach(model => {
            graph.updateComboTree(model.id, model.parentId, false);
          });
        });
        break;
      default:
    }
  };

  React.useEffect(() => {
    const handleStackChanage = evt => {
      const { undoStack, redoStack } = evt as any;
      const undoStackLen = undoStack.length;
      const redoStackLen = redoStack.length;

      setBtnDisable({
        undo: undoStackLen > 2 ? false : true,
        redo: redoStackLen > 0 ? false : true,
      });
    };
    graph.on('stackchange', handleStackChanage);
    return () => {
      graph.off('stackchange', handleStackChanage);
    };
  }, [graph]);
  return {
    handleRedo,
    handleUndo,
    disableUndo: btnDisable.undo,
    disableRedo: btnDisable.redo,
  };
};

export default useRedoUndo;
