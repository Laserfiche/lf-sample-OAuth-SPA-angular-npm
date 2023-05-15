import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {
  PostEntryWithEdocMetadataRequest,
  FileParameter,
  RepositoryApiClient,
  IRepositoryApiClient,
  PutFieldValsRequest,
  FieldToUpdate,
  ValueToUpdate,
  EntryType,
  Shortcut,
  PostEntryChildrenRequest,
  PostEntryChildrenEntryType,
} from '@laserfiche/lf-repository-api-client';
import {
  LfFieldsService,
  LfRepoTreeNodeService,
  IRepositoryApiClientEx,
  LfRepoTreeNode,
} from '@laserfiche/lf-ui-components-services';
import { LfLocalizationService, PathUtils } from '@laserfiche/lf-js-utils';
import { LfLoginComponent } from '@laserfiche/lf-ui-components/lf-login';
import { LfFieldContainerComponent } from '@laserfiche/lf-ui-components/lf-metadata';
import { LoginState } from '@laserfiche/lf-ui-components/shared';
import {
  LfRepositoryBrowserComponent,
  LfTreeNode,
} from '@laserfiche/lf-ui-components/lf-repository-browser';
import { ColumnDef } from '@laserfiche/lf-ui-components/lf-selection-list';
import { ToolbarOption } from '@laserfiche/lf-ui-components/shared';
import { getEntryWebAccessUrl } from './lf-url-utils';
import { MatDialog } from '@angular/material/dialog';
import { NewFolderModalComponent } from './new-folder-modal/new-folder-modal.component';
import { EditColumnsModalComponent } from './edit-columns-modal/edit-columns-modal.component';
import config from './config';

const resources: Map<string, object> = new Map<string, object>([
  [
    'en-US',
    {
      FOLDER_BROWSER_PLACEHOLDER: 'No folder selected',
      SAVE_TO_LASERFICHE: 'Save to Laserfiche',
      CLICK_TO_UPLOAD: 'Click to upload file',
      SELECTED_FOLDER: 'Selected Folder: ',
      FILE_NAME: 'File Name: ',
      BROWSE: 'Browse',
      OPEN_IN_LASERFICHE: 'Open in Laserfiche',
      SELECT: 'Select',
      CANCEL: 'Cancel',
      ERROR_SAVING: 'Error Saving',
      PLEASE_PROVIDE_FOLDER_NAME: 'Please provide a folder name.',
      NO_CURRENTLY_OPENED_FOLDER: 'There is no currently opened folder.',
    },
  ],
]);

interface IRepositoryApiClientExInternal extends IRepositoryApiClientEx {
  clearCurrentRepo: () => void;
  _repoId?: string;
  _repoName?: string;
}

interface ILfSelectedFolder {
  selectedNodeUrl: string; // url to open the selected node in Web Client
  selectedFolderPath: string; // path of selected folder
  selectedFolderName: string; // name of the selected folder
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit {
  config = config;

  toolbarOptions: ToolbarOption[] = [
    {
      name: 'Refresh',
      disabled: false,
      tag: {
        handler: async () => {
          await this.lfRepositoryBrowser?.nativeElement.refreshAsync();
        },
      },
    },
    {
      name: 'New Folder',
      disabled: false,
      tag: {
        handler: () => {
          this.openNewFolderDialog();
        },
      },
    },
    {
      name: 'Add/Remove Columns',
      disabled: false,
      tag: {
        handler: () => {
          this.openEditColumnsDialog();
        },
      },
    },
  ];
  allPossibleColumns: ColumnDef[] = [
    {
      id: 'creationTime',
      displayName: 'Creation Time',
      defaultWidth: 'auto',
      resizable: true,
      sortable: true,
    },
    {
      id: 'lastModifiedTime',
      displayName: 'Last Modified Time',
      defaultWidth: 'auto',
      resizable: true,
      sortable: true,
    },
    {
      id: 'pageCount',
      displayName: 'Page Count',
      defaultWidth: 'auto',
      resizable: true,
      sortable: true,
    },
    {
      id: 'templateName',
      displayName: 'Template Name',
      defaultWidth: 'auto',
      resizable: true,
      sortable: true,
    },
    {
      id: 'creator',
      displayName: 'Author',
      defaultWidth: 'auto',
      resizable: true,
      sortable: true,
    },
  ];
  selectedColumns: ColumnDef[] = [
    {
      id: 'name',
      displayName: 'Name',
      defaultWidth: 'auto',
      minWidthPx: 100,
      resizable: true,
      sortable: true,
    },
    this.allPossibleColumns[0],
    this.allPossibleColumns[4],
  ];

  // repository client that will be used to connect to the LF API
  private repoClient?: IRepositoryApiClientExInternal;
  // used to get the file user is trying to save
  @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>;

  lfSelectedFolder: ILfSelectedFolder | undefined;

  // the UI components
  @ViewChild('lfFieldContainerElement')
  lfFieldContainerElement: ElementRef<LfFieldContainerComponent>;
  @ViewChild('loginComponent') loginComponent?: ElementRef<LfLoginComponent>;
  @ViewChild('lfRepositoryBrowser')
  lfRepositoryBrowser?: ElementRef<LfRepositoryBrowserComponent>;

  // services needed for UI components
  lfFieldsService?: LfFieldsService;
  lfRepoTreeNodeService?: LfRepoTreeNodeService;

  // localization service from lf-js-utils
  localizationService = new LfLocalizationService(resources);

  // determines if the folder browser should be expanded
  expandFolderBrowser: boolean;

  fileSelected?: File;
  fileName?: string;
  fileExtension?: string;
  entrySelected: LfTreeNode;

  constructor(private ref: ChangeDetectorRef, public dialog: MatDialog) {}

  // Angular hook, after view is initiated
  async ngAfterViewInit(): Promise<void> {
    await this.getAndInitializeRepositoryClientAndServicesAsync();
    await this.initializeFieldContainerAsync();
  }

  setColumns(columns) {
    this.lfRepositoryBrowser?.nativeElement.setColumnsToDisplay(columns);
    this.selectedColumns = columns;
  }

  async onLoginCompletedAsync() {
    await this.getAndInitializeRepositoryClientAndServicesAsync();
    await this.initializeFieldContainerAsync();
  }

  onLogoutCompleted() {
    this.repoClient.clearCurrentRepo();
  }

  private async getAndInitializeRepositoryClientAndServicesAsync() {
    // get accessToken from login component
    const accessToken =
      this.loginComponent?.nativeElement?.authorization_credentials
        ?.accessToken;
    if (accessToken) {
      await this.ensureRepoClientInitializedAsync();

      // create the tree service to interact with the LF Api
      this.lfRepoTreeNodeService = new LfRepoTreeNodeService(this.repoClient);
      // by default all entries are viewable
      this.lfRepoTreeNodeService.viewableEntryTypes = [
        EntryType.Folder,
        EntryType.Shortcut,
      ];

      // create the fields service to let the field component interact with Laserfiche
      this.lfFieldsService = new LfFieldsService(this.repoClient);
    } else {
      // user is not logged in
    }
  }

  private afterFetchResponseAsync = async (url, response, request) => {
    if (response.status === 401) {
      // this will initialize the login flow if refresh is unsuccessful
      const refresh = await this.loginComponent.nativeElement.refreshTokenAsync(
        true
      );
      if (refresh) {
        request.headers['Authorization'] =
          'Bearer ' +
          this.loginComponent.nativeElement.authorization_credentials
            .accessToken;
        return true;
      } else {
        this.repoClient.clearCurrentRepo();
        return false;
      }
    }
    return false;
  };

  private beforeFetchRequestAsync = async (url, request) => {
    // need to get accessToken each time
    const accessToken =
      this.loginComponent.nativeElement.authorization_credentials.accessToken;
    if (accessToken) {
      request.headers['Authorization'] = 'Bearer ' + accessToken;
      let regionalDomain: string =
        this.loginComponent.nativeElement.account_endpoints.regionalDomain;
      if (!regionalDomain) {
        console.log('could not get regionalDomain from loginComponent');
        regionalDomain = config.HOST_NAME;
      }
      return { regionalDomain };
    } else {
      throw new Error('Access Token undefined.');
    }
  };

  private getCurrentRepo = async () => {
    const repos = await this.repoClient.repositoriesClient.getRepositoryList(
      {}
    );
    const repo = repos[0];
    if (repo.repoId && repo.repoName) {
      return { repoId: repo.repoId, repoName: repo.repoName };
    }
    throw new Error('Current repoId undefined.');
  };

  async ensureRepoClientInitializedAsync(): Promise<void> {
    if (!this.repoClient) {
      const partialRepoClient: IRepositoryApiClient =
        RepositoryApiClient.createFromHttpRequestHandler({
          beforeFetchRequestAsync: this.beforeFetchRequestAsync,
          afterFetchResponseAsync: this.afterFetchResponseAsync,
        });

      const clearCurrentRepo = () => {
        this.repoClient._repoId = undefined;
        this.repoClient._repoName = undefined;
        // TODO is there anything else to clear?
      };
      this.repoClient = {
        clearCurrentRepo,
        _repoId: undefined,
        _repoName: undefined,
        getCurrentRepoId: async () => {
          if (this.repoClient._repoId) {
            return this.repoClient._repoId;
          } else {
            const repo = (await this.getCurrentRepo()).repoId;
            this.repoClient._repoId = repo;
            return repo;
          }
        },
        getCurrentRepoName: async () => {
          if (this.repoClient._repoName) {
            return this.repoClient._repoName;
          } else {
            const repo = (await this.getCurrentRepo()).repoName;
            this.repoClient._repoName = repo;
            return repo;
          }
        },
        ...partialRepoClient,
      };
    }
  }

  async initializeFieldContainerAsync() {
    this.ref.detectChanges();
    await this.lfFieldContainerElement?.nativeElement?.initAsync(
      this.lfFieldsService
    );
  }

  async initializeTreeAsync() {
    this.ref.detectChanges();
    let focusedNode: LfRepoTreeNode | undefined;
    if (this.lfSelectedFolder) {
      const repoId = await this.repoClient.getCurrentRepoId();
      const focusNodeByPath =
        await this.repoClient.entriesClient.getEntryByPath({
          repoId: repoId,
          fullPath: this.lfSelectedFolder.selectedFolderPath,
        });
      const repoName = await this.repoClient.getCurrentRepoName();
      const focusedNodeEntry = focusNodeByPath?.entry;
      if (focusedNodeEntry) {
        focusedNode = this.lfRepoTreeNodeService.createLfRepoTreeNode(
          focusedNodeEntry,
          repoName
        );
      }
    }
    await this.lfRepositoryBrowser?.nativeElement.initAsync(
      this.lfRepoTreeNodeService,
      focusedNode
    );
  }

  isNodeSelectable = (node: LfRepoTreeNode) => {
    if (node.entryType == EntryType.Folder) {
      return true;
    } else if (
      node.entryType == EntryType.Shortcut &&
      node.targetType == EntryType.Folder
    ) {
      return true;
    } else {
      return false;
    }
  };

  get isLoggedIn(): boolean {
    return this.loginComponent?.nativeElement?.state === LoginState.LoggedIn;
  }

  // Tree event handler methods
  async onSelectFolder() {
    const selectedNode = this.lfRepositoryBrowser.nativeElement
      .currentFolder as LfRepoTreeNode;
    let entryId = Number.parseInt(selectedNode.id, 10);
    const selectedFolderPath = selectedNode.path;
    if (selectedNode.entryType == EntryType.Shortcut) {
      entryId = selectedNode.targetId;
    }
    const repoId = await this.repoClient.getCurrentRepoId();
    const waUrl =
      this.loginComponent.nativeElement.account_endpoints.webClientUrl;
    this.expandFolderBrowser = false;
    this.lfSelectedFolder = {
      selectedNodeUrl: getEntryWebAccessUrl(
        entryId.toString(),
        repoId,
        waUrl,
        selectedNode.isContainer
      ),
      selectedFolderName: this.getFolderNameText(entryId, selectedFolderPath),
      selectedFolderPath: selectedFolderPath,
    };
  }

  get shouldShowSelect(): boolean {
    return (
      !this.shouldShowOpen &&
      !!this.lfRepositoryBrowser?.nativeElement?.currentFolder
    );
  }

  get shouldShowOpen(): boolean {
    return !!this.entrySelected;
  }

  onEntrySelected(event) {
    const customEvent = event as CustomEvent<LfTreeNode[]>;
    const treeNodesSelected: LfTreeNode[] = customEvent.detail;
    this.entrySelected =
      treeNodesSelected?.length > 0 ? treeNodesSelected[0] : undefined;
  }

  async onToolbarOptionSelected(event) {
    const customEvent = event as CustomEvent<ToolbarOption>;
    await customEvent.detail.tag.handler();
  }

  openNewFolderDialog(): void {
    this.dialog.open(NewFolderModalComponent, {
      data: { makeNewFolder: this.makeNewFolder.bind(this) },
    });
  }

  openEditColumnsDialog(): void {
    this.dialog.open(EditColumnsModalComponent, {
      data: {
        columnsSelected: this.selectedColumns,
        allColumnOptions: this.allPossibleColumns,
        updateColumns: this.updateColumns.bind(this),
      },
    });
  }

  async makeNewFolder(folderName: string) {
    if (folderName) {
      if (!this.lfRepositoryBrowser?.nativeElement?.currentFolder) {
        throw new Error(
          this.localizationService.getString('NO_CURRENTLY_OPENED_FOLDER')
        );
      }
      await this.addNewFolderAsync(
        this.lfRepositoryBrowser?.nativeElement?.currentFolder,
        folderName
      );
      await this.lfRepositoryBrowser?.nativeElement?.refreshAsync();
    } else {
      throw new Error(
        this.localizationService.getString('PLEASE_PROVIDE_FOLDER_NAME')
      );
    }
  }

  async addNewFolderAsync(
    parentNode: LfTreeNode,
    folderName: string
  ): Promise<void> {
    if (!this.repoClient) {
      throw new Error('repoClient is undefined');
    }
    const entryId = (parentNode as LfRepoTreeNode).targetId ?? parseInt(parentNode.id, 10);
    const request: PostEntryChildrenRequest =
      new PostEntryChildrenRequest({
        name: folderName,
        entryType: PostEntryChildrenEntryType.Folder,
      });
    const repoId: string = await this.repoClient.getCurrentRepoId();
    await this.repoClient?.entriesClient.createOrCopyEntry({repoId,entryId,request,});
  }

  updateColumns(columns: ColumnDef[]) {
    this.selectedColumns = columns;
    this.setColumns(columns);
  }

  async onOpenNode() {
    await this.lfRepositoryBrowser?.nativeElement?.openSelectedNodesAsync();
  }

  async onClickBrowse() {
    this.expandFolderBrowser = true;
    this.lfRepoTreeNodeService.columnIds = this.allPossibleColumns.map(
      (columnDef) => columnDef.id
    );
    await this.initializeTreeAsync();
    this.setColumns(this.selectedColumns);
  }

  get selectedFolderDisplayName(): string {
    const FOLDER_BROWSER_PLACEHOLDER = this.localizationService.getString(
      'FOLDER_BROWSER_PLACEHOLDER'
    );
    return (
      this.lfSelectedFolder?.selectedFolderName ?? FOLDER_BROWSER_PLACEHOLDER
    );
  }

  private getFolderNameText(entryId: number, path: string): string {
    if (path) {
      const displayPath: string = path;
      if (!entryId) {
        return displayPath;
      } else {
        const baseName: string = PathUtils.getLastPathSegment(displayPath);
        if (!baseName || baseName.length === 0) {
          return '\\';
        } else {
          return baseName;
        }
      }
    } else {
      return 'FOLDER_BROWSER_PLACEHOLDER';
    }
  }
  onFolderBrowserCancelClick() {
    this.expandFolderBrowser = false;
  }

  // metadata (field-container) handlers

  adhocDialogOpened() {
    // "hack" for add remove dialog on smaller screen
    document.body.scrollTo({ top: 0, left: 0 });
    document.body.style.overflow = 'hidden';
  }

  adhocDialogClosed() {
    // "hack" for add remove dialog on smaller screen
    document.body.scrollTo({ top: 0, left: 0 });
    document.body.style.overflow = 'auto';
  }

  // input handler methods
  onInputAreaClick() {
    this.fileInput.nativeElement.click();
  }

  async selectFileAsync() {
    const files = this.fileInput.nativeElement.files;
    this.fileSelected = files.item(0);
    this.fileName = PathUtils.removeFileExtension(this.fileSelected.name);
    this.fileExtension = PathUtils.getFileExtension(this.fileSelected.name);
  }

  clearFileSelected() {
    this.fileInput.nativeElement.files = undefined;
    this.fileSelected = undefined;
    this.fileName = undefined;
    this.fileExtension = undefined;
  }

  // save to LF handlers

  get enableSave(): boolean {
    const fileSelected: boolean = !!this.fileSelected;
    const folderSelected: boolean = !!this.lfSelectedFolder;

    return fileSelected && folderSelected;
  }

  async onClickSave() {
    const valid =
      this.lfFieldContainerElement?.nativeElement?.forceValidation();
    if (valid) {
      const fileNameWithExtension = this.fileName + '.' + this.fileExtension;
      const edocBlob: FileParameter = {
        data: this.fileSelected as Blob,
        fileName: fileNameWithExtension,
      };

      const metadataRequest = await this.createMetadataRequestAsync();
      const entryRequest: PostEntryWithEdocMetadataRequest =
        new PostEntryWithEdocMetadataRequest({
          metadata: metadataRequest.metadata,
          template: metadataRequest.template,
        });

      try {
        const repoId = await this.repoClient.getCurrentRepoId();
        const currentSelectedByPathResponse =
          await this.repoClient.entriesClient.getEntryByPath({
            repoId,
            fullPath: this.lfSelectedFolder.selectedFolderPath,
          });
        const currentSelectedEntry = currentSelectedByPathResponse.entry;
        let parentEntryId = currentSelectedEntry.id;
        if (currentSelectedEntry.entryType == EntryType.Shortcut) {
          const shortcut = currentSelectedEntry as Shortcut;
          parentEntryId = shortcut.targetId;
        }
        await this.repoClient.entriesClient.importDocument({
          repoId,
          parentEntryId,
          fileName: this.fileName,
          autoRename: true,
          electronicDocument: edocBlob,
          request: entryRequest,
        });
        window.alert('Successfully saved document to Laserfiche');
      } catch (err: any) {
        console.error(err);
        window.alert(
          `${this.localizationService.getString('ERROR_SAVING')}: ${
            err.message
          }`
        );
      }
    } else {
      console.warn('metadata invalid');
      window.alert('One or more fields is invalid. Please fix and try again');
    }
  }

  private async createMetadataRequestAsync(): Promise<PostEntryWithEdocMetadataRequest> {
    const fieldValues =
      this.lfFieldContainerElement?.nativeElement?.getFieldValues() ?? {};
    const templateName =
      this.lfFieldContainerElement?.nativeElement?.getTemplateValue()?.name ??
      '';

    const formattedFieldValues:
      | {
          [key: string]: FieldToUpdate;
        }
      | undefined = {};

    for (const key in fieldValues) {
      const value = fieldValues[key];
      formattedFieldValues[key] = new FieldToUpdate({
        ...value,
        values: value.values.map((val) => new ValueToUpdate(val)),
      });
    }

    const requestMetadata: PostEntryWithEdocMetadataRequest =
      this.getPostEntryRequest(templateName, formattedFieldValues);
    return requestMetadata;
  }

  private getPostEntryRequest(
    templateName: string | undefined,
    allFields:
      | {
          [key: string]: FieldToUpdate;
        }
      | undefined
  ): PostEntryWithEdocMetadataRequest {
    const entryRequest: PostEntryWithEdocMetadataRequest =
      new PostEntryWithEdocMetadataRequest({
        metadata: new PutFieldValsRequest({
          fields: allFields,
        }),
      });
    if (templateName && templateName.length > 0) {
      entryRequest.template = templateName;
    }
    return entryRequest;
  }

  // localization helpers

  BROWSE = this.localizationService.getString('BROWSE');
  FOLDER_BROWSER_PLACEHOLDER = this.localizationService.getString(
    'FOLDER_BROWSER_PLACEHOLDER'
  );
  SAVE_TO_LASERFICHE = this.localizationService.getString('SAVE_TO_LASERFICHE');
  CLICK_TO_UPLOAD = this.localizationService.getString('CLICK_TO_UPLOAD');
  SELECTED_FOLDER = this.localizationService.getString('SELECTED_FOLDER');
  FILE_NAME = this.localizationService.getString('FILE_NAME');
  OPEN_IN_LASERFICHE = this.localizationService.getString('OPEN_IN_LASERFICHE');
  SELECT = this.localizationService.getString('SELECT');
  CANCEL = this.localizationService.getString('CANCEL');
}
