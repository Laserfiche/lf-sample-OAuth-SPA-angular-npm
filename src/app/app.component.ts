// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
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
import config from '../config';
import { UrlUtils } from '@laserfiche/lf-js-utils';

const resources: Map<string, object> = new Map<string, object>([
  [
    'en-US',
    {
      FOLDER_BROWSER_PLACEHOLDER: 'No folder selected',
      SAVE_TO_LASERFICHE: 'Save to Laserfiche',
      CLICK_TO_UPLOAD: 'Click to upload file',
      SELECTED_FOLDER_COLON: 'Selected Folder:',
      FILE_NAME_COLON: 'File Name:',
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
  signInOption = 'redirect';
  loginPageUrl = UrlUtils.combineURLs(
    config.REDIRECT_URI,
    '/popup-login.html'
  );

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
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  lfSelectedFolder?: ILfSelectedFolder;

  // the UI components
  @ViewChild('lfFieldContainerElement')
  lfFieldContainerElement?: ElementRef<LfFieldContainerComponent>;
  // loginComponent references both the redirect login component and the hidden popup login component
  @ViewChild('loginComponent') loginComponent?: ElementRef<LfLoginComponent>;
  @ViewChild('lfRepositoryBrowser')
  lfRepositoryBrowser?: ElementRef<LfRepositoryBrowserComponent>;

  // services needed for UI components
  lfFieldsService?: LfFieldsService;
  lfRepoTreeNodeService?: LfRepoTreeNodeService;

  // localization service from lf-js-utils
  localizationService = new LfLocalizationService(resources);

  // determines if the folder browser should be expanded
  expandFolderBrowser = false;

  fileSelected?: File;
  fileName?: string;
  fileExtension?: string;
  entrySelected?: LfTreeNode;

  constructor(private ref: ChangeDetectorRef, public dialog: MatDialog) {}

  // Angular hook, after view is initiated
  async ngAfterViewInit(): Promise<void> {
    await this.getAndInitializeRepositoryClientAndServicesAsync();
    await this.initializeFieldContainerAsync();
  }

  get buttontext() {
    return this.loginComponent?.nativeElement.state === LoginState.LoggedIn
      ? 'Sign Out with popup'
      : 'Sign In with popup';
  }

  openLogin() {
    window.open(this.loginPageUrl, '_blank', 'popup');
  }

  setColumns(columns: ColumnDef[]) {
    this.lfRepositoryBrowser?.nativeElement.setColumnsToDisplay(columns);
    this.selectedColumns = columns;
  }

  async onLoginCompletedAsync() {
    await this.getAndInitializeRepositoryClientAndServicesAsync();
    await this.initializeFieldContainerAsync();
  }

  onLogoutCompleted() {
    if (!this.repoClient) {
      throw new Error('repoClient is undefined');
    }
    this.repoClient.clearCurrentRepo();
  }

  private async getAndInitializeRepositoryClientAndServicesAsync() {
    // get accessToken from login component
    const accessToken =
      this.loginComponent?.nativeElement?.authorization_credentials
        ?.accessToken;
    if (accessToken) {
      if (!this.repoClient) {
        this.repoClient = await this.tryInitRepoClientAsync();
      }
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

  async tryInitRepoClientAsync(): Promise<IRepositoryApiClientExInternal> {
    if (!this.loginComponent) {
      throw new Error('Login Component is undefined');
    }
    const repoClient = await this.makeRepoClientFromLoginComponent(
      this.loginComponent.nativeElement
    );
    return repoClient;
  }

  private async makeRepoClientFromLoginComponent(
    loginComponent: LfLoginComponent
  ): Promise<IRepositoryApiClientExInternal> {
    const partialRepoClient: IRepositoryApiClient =
      RepositoryApiClient.createFromHttpRequestHandler(
        loginComponent.authorizationRequestHandler
      );

    const getCurrentRepo = async (
      repoClient: IRepositoryApiClientExInternal
    ) => {
      const repos = await repoClient.repositoriesClient.getRepositoryList({});
      const repo = repos ? repos[0] : undefined;
      if (repo?.repoId && repo?.repoName) {
        return { repoId: repo.repoId, repoName: repo.repoName };
      }
      throw new Error('Current repo id or name undefined.');
    };
    const repoClient: IRepositoryApiClientExInternal = {
      _repoId: undefined,
      _repoName: undefined,
      clearCurrentRepo: function (): void {
        repoClient._repoId = undefined;
        repoClient._repoName = undefined;
      },
      getCurrentRepoId: async function (): Promise<string> {
        if (repoClient._repoId) {
          return repoClient._repoId;
        } else {
          const repoId = (await getCurrentRepo(repoClient)).repoId;
          repoClient._repoId = repoId;
          return repoId;
        }
      },
      getCurrentRepoName: async function (): Promise<string> {
        if (repoClient._repoName) {
          return repoClient._repoName;
        } else {
          const repoName = (await getCurrentRepo(repoClient)).repoName;
          repoClient._repoName = repoName;
          return repoName;
        }
      },
      ...partialRepoClient,
    };
    return repoClient;
  }

  async initializeFieldContainerAsync() {
    this.ref.detectChanges();
    if (this.lfFieldsService) {
      await this.lfFieldContainerElement?.nativeElement?.initAsync(
        this.lfFieldsService
      );
    }
  }

  async initializeTreeAsync() {
    this.ref.detectChanges();
    if (this.lfRepoTreeNodeService) {
      await this.lfRepositoryBrowser?.nativeElement.initAsync(
        this.lfRepoTreeNodeService,
        this.lfSelectedFolder?.selectedFolderPath
      );
    }
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
    if (
      !this.lfRepositoryBrowser ||
      !this.repoClient ||
      !this.loginComponent ||
      !this.loginComponent.nativeElement.account_endpoints
    ) {
      throw new Error(
        'Could not set lfSelectedFolder: some of {lfRepositoryBrowser, repoClient, loginComponent, account_endpoints} were undefined'
      );
    }
    const selectedNode = this.lfRepositoryBrowser.nativeElement
      .currentFolder as LfRepoTreeNode;
    let entryId = Number.parseInt(selectedNode.id, 10);
    const selectedFolderPath = selectedNode.path;
    if (selectedNode.entryType == EntryType.Shortcut && selectedNode.targetId) {
      entryId = selectedNode.targetId;
    }
    const repoId = await this.repoClient.getCurrentRepoId();
    const waUrl =
      this.loginComponent.nativeElement.account_endpoints.webClientUrl;
    this.expandFolderBrowser = false;
    this.lfSelectedFolder = {
      selectedNodeUrl:
        getEntryWebAccessUrl(
          entryId.toString(),
          repoId,
          waUrl,
          selectedNode.isContainer
        ) ?? '',
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

  onEntrySelected(event: Event) {
    const customEvent = event as CustomEvent<LfTreeNode[]>;
    const treeNodesSelected: LfTreeNode[] = customEvent.detail;
    this.entrySelected =
      treeNodesSelected?.length > 0 ? treeNodesSelected[0] : undefined;
  }

  async onToolbarOptionSelected(event: Event) {
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
    const entryId =
      (parentNode as LfRepoTreeNode).targetId ?? parseInt(parentNode.id, 10);
    const request: PostEntryChildrenRequest = new PostEntryChildrenRequest({
      name: folderName,
      entryType: PostEntryChildrenEntryType.Folder,
    });
    const repoId: string = await this.repoClient.getCurrentRepoId();
    await this.repoClient?.entriesClient.createOrCopyEntry({
      repoId,
      entryId,
      request,
    });
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
    if (this.lfRepoTreeNodeService) {
      this.lfRepoTreeNodeService.columnIds = this.allPossibleColumns.map(
        (columnDef) => columnDef.id
      );
    }
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
    if (!this.fileInput) {
      throw new Error('file input undefined');
    }
    this.fileInput.nativeElement.click();
  }

  async selectFileAsync() {
    const files = this.fileInput?.nativeElement.files;
    this.fileSelected = files?.item(0) ?? undefined;
    if (this.fileSelected?.name) {
      this.fileName = PathUtils.removeFileExtension(this.fileSelected.name);
      this.fileExtension = PathUtils.getFileExtension(this.fileSelected.name);
    }
  }

  clearFileSelected() {
    if (this.fileInput) {
      this.fileInput.nativeElement.files = null;
    }
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
        await this.trySaveDocument(edocBlob, entryRequest);
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

  private async trySaveDocument(
    edocBlob: FileParameter,
    entryRequest: PostEntryWithEdocMetadataRequest
  ) {
    if (!this.repoClient) {
      throw new Error('repoClient was undefined');
    }
    if (!this.lfSelectedFolder) {
      throw new Error('selectedFolder was undefined');
    }
    if (!this.fileName) {
      throw new Error('fileName was undefined');
    }
    const repoId = await this.repoClient.getCurrentRepoId();
    const currentSelectedByPathResponse =
      await this.repoClient.entriesClient.getEntryByPath({
        repoId,
        fullPath: this.lfSelectedFolder.selectedFolderPath,
      });
    const currentSelectedEntry = currentSelectedByPathResponse.entry;
    if (!currentSelectedEntry) {
      throw new Error('currentSelectedEntry was undefined');
    }
    let parentEntryId = currentSelectedEntry.id;
    if (currentSelectedEntry.entryType == EntryType.Shortcut) {
      const shortcut = currentSelectedEntry as Shortcut;
      parentEntryId = shortcut.targetId;
    }
    if (!parentEntryId) {
      throw new Error('parentEntryId was undefined');
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
        values: (value.values ?? []).map((val) => new ValueToUpdate(val)),
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
  SELECTED_FOLDER_COLON = this.localizationService.getString(
    'SELECTED_FOLDER_COLON'
  );
  FILE_NAME_COLON = this.localizationService.getString('FILE_NAME_COLON');
  OPEN_IN_LASERFICHE = this.localizationService.getString('OPEN_IN_LASERFICHE');
  SELECT = this.localizationService.getString('SELECT');
  CANCEL = this.localizationService.getString('CANCEL');
}
