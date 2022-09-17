import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { PostEntryWithEdocMetadataRequest, FileParameter, RepositoryApiClient, IRepositoryApiClient, PutFieldValsRequest, FieldToUpdate, ValueToUpdate, Entry, EntryType } from '@laserfiche/lf-repository-api-client';
import { LfFieldsService, LfRepoTreeNodeService, IRepositoryApiClientEx, LfRepoTreeNode } from '@laserfiche/lf-ui-components-services';
import { LfLocalizationService, PathUtils } from '@laserfiche/lf-js-utils';
import { LfLoginComponent } from '@laserfiche/lf-ui-components/lf-login';
import { LfFieldContainerComponent } from '@laserfiche/lf-ui-components/lf-metadata';
import { LoginState } from '@laserfiche/lf-ui-components/shared';
import { LfRepositoryBrowserComponent, LfTreeNode } from '@laserfiche/lf-ui-components/lf-repository-browser';
import { getEntryWebAccessUrl } from './lf-url-utils';

const resources: Map<string, object> = new Map<string, object>([
  ['en-US', {
    'FOLDER_BROWSER_PLACEHOLDER': 'No folder selected',
    'SAVE_TO_LASERFICHE': 'Save to Laserfiche',
    'CLICK_TO_UPLOAD': 'Click to upload file',
    'SELECTED_FOLDER': 'Selected Folder: ',
    'FILE_NAME': 'File Name: ',
    'BROWSE': 'Browse',
    'OPEN_IN_LASERFICHE': 'Open in Laserfiche',
    'SELECT': 'Select',
    'CANCEL': 'Cancel',
    'ERROR_SAVING': 'Error Saving'
  }]
]);

interface IRepositoryApiClientExInternal extends IRepositoryApiClientEx {
  clearCurrentRepo: () => void;
  _repoId?: string;
  _repoName?: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  REDIRECT_URI: string = 'REPLACE_WITH_YOUR_REDIRECT_URI'; // i.e http://localhost:3000, https://serverName/lf-sample/index.html
  CLIENT_ID: string = 'REPLACE_WITH_YOUR_CLIENT_ID';
  HOST_NAME: string = 'laserfiche.com'; // only update this if you are using a different region or environment (i.e. laserfiche.ca, eu.laserfiche.com)
  REGIONAL_DOMAIN: string = 'laserfiche.com' // only update this if you are using a different region or environment

  // repository client that will be used to connect to the LF API
  private repoClient?: IRepositoryApiClientExInternal;

  // url to open the selected node in Web Client
  selectedNodeUrl?: string;

  // the folder the user has selected in the folder-browser
  selectedFolderPath: string;
  selectedFolderId: number;
  selectedFolderName: string;
  // used to get the file user is trying to save
  @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>;

  // the UI components
  @ViewChild('lfFieldContainerElement') lfFieldContainerElement?: ElementRef<LfFieldContainerComponent>;
  @ViewChild('loginComponent') loginComponent?: ElementRef<LfLoginComponent>;
  @ViewChild('lfRepositoryBrowser') lfRepositoryBrowser?: ElementRef<LfRepositoryBrowserComponent>;

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

  constructor(
    private ref: ChangeDetectorRef
  ) { }

  // Angular hook, after view is initiated
  async ngAfterViewInit(): Promise<void> {
    await this.getAndInitializeRepositoryClientAndServicesAsync();
  }

  async onLoginCompletedAsync() {
    await this.getAndInitializeRepositoryClientAndServicesAsync();
  }

  onLogoutCompleted() {
    this.repoClient.clearCurrentRepo();
  }

  private async getAndInitializeRepositoryClientAndServicesAsync() {
    // get accessToken from login component
    const accessToken = this.loginComponent?.nativeElement?.authorization_credentials?.accessToken;
    if (accessToken) {
      await this.ensureRepoClientInitializedAsync();

      // create the tree service to interact with the LF Api
      this.lfRepoTreeNodeService = new LfRepoTreeNodeService(this.repoClient);
      console.log('initialized lfRepoTreeNodeService')
      // by default all entries are viewable
      this.lfRepoTreeNodeService.viewableEntryTypes = [EntryType.Folder, EntryType.Shortcut, EntryType.Document];

      // create the fields service to let the field component interact with Laserfiche
      this.lfFieldsService = new LfFieldsService(this.repoClient);
      await this.initializeFieldContainerAsync();
    }
    else {
      // user is not logged in
    }
  }

  private afterFetchResponseAsync = async (url, response, request) => {
    if (response.status === 401) {
      // this will initialize the login flow if refresh is unsuccessful
      const refresh = await this.loginComponent.nativeElement.refreshTokenAsync(true);
      if (refresh) {
        request.headers['Authorization'] = 'Bearer ' + this.loginComponent.nativeElement.authorization_credentials.accessToken;
        return true;
      }
      else {
        this.repoClient.clearCurrentRepo();
        return false;
      }
    }
    return false;
  }

  private beforeFetchRequestAsync = async (url, request) => {
    // need to get accessToken each time
    const accessToken = this.loginComponent.nativeElement.authorization_credentials.accessToken;
    if (accessToken) {
      request.headers['Authorization'] = 'Bearer ' + accessToken;
      return { regionalDomain: this.REGIONAL_DOMAIN } // update this if you want CA, EU, dev
    }
    else {
      throw new Error('Access Token undefined.');
    }
  };

  private getCurrentRepo = async () => {
    const repos = await this.repoClient.repositoriesClient.getRepositoryList({});
    const repo = repos[0];
    if (repo.repoId && repo.repoName) {
      return { repoId: repo.repoId, repoName: repo.repoName };
    }
    throw new Error('Current repoId undefined.')
  };

  async ensureRepoClientInitializedAsync(): Promise<void> {

    if (!this.repoClient) {
      const partialRepoClient: IRepositoryApiClient =
        RepositoryApiClient.createFromHttpRequestHandler(
          {
            beforeFetchRequestAsync: this.beforeFetchRequestAsync,
            afterFetchResponseAsync: this.afterFetchResponseAsync
          });

      const clearCurrentRepo = () => {
        this.repoClient._repoId = undefined;
        this.repoClient._repoName = undefined;
        // TODO is there anything else to clear?
      }
      this.repoClient = {
        clearCurrentRepo,
        _repoId: undefined,
        _repoName: undefined,
        getCurrentRepoId: async () => {
          if (this.repoClient._repoId) {
            return this.repoClient._repoId
          }
          else {
            const repo = (await this.getCurrentRepo()).repoId;
            this.repoClient._repoId = repo;
            return repo;
          }
        },
        getCurrentRepoName: async () => {
          if (this.repoClient._repoName) {
            return this.repoClient._repoName;
          }
          else {
            const repo = (await this.getCurrentRepo()).repoName;
            this.repoClient._repoName = repo;
            return repo;
          }
        },
        ...partialRepoClient
      }
    }
  }

  async initializeFieldContainerAsync() {
    this.ref.detectChanges();
    await this.lfFieldContainerElement?.nativeElement?.initAsync(this.lfFieldsService);
  }

  async initializeTreeAsync() {
    this.ref.detectChanges();
    let focusedNode;
    if (this.selectedFolderPath) {
      let repoId = await this.repoClient.getCurrentRepoId();
      let focusNodeByPath = await this.repoClient.entriesClient.getEntryByPath({
          repoId: repoId,
          fullPath: this.selectedFolderPath
        });
        const focusedNodeEntry = focusNodeByPath?.entry;
        if (focusedNodeEntry) {
          focusedNode = {
            id: focusedNodeEntry.id.toString(),
            isContainer: focusedNodeEntry.isContainer,
            isLeaf: focusedNodeEntry.isLeaf,
            path: this.selectedFolderPath,
            name: focusedNodeEntry.name,
          };
        }
    }
    await this.lfRepositoryBrowser?.nativeElement.initAsync(this.lfRepoTreeNodeService, focusedNode as LfRepoTreeNode);
  }

  isNodeSelectable = (node: LfRepoTreeNode) => {
    if (node.entryType == EntryType.Folder) {
      return true
    }
    else {
      return false
    }
  }

  get isLoggedIn(): boolean {
    console.log('here', this.loginComponent?.nativeElement?.state)
    return this.loginComponent?.nativeElement?.state === LoginState.LoggedIn;
  }

  // Tree event handler methods
  async onSelectFolder() {
    const selectedNode = this.lfRepositoryBrowser.nativeElement.currentFolder as LfRepoTreeNode;
    let entryId = Number.parseInt(selectedNode.id, 10);
    this.selectedFolderPath = selectedNode.path;
    if (selectedNode.entryType == EntryType.Shortcut) {
      entryId = selectedNode.targetId;
    }
    this.selectedFolderId = entryId;
    this.selectedFolderName = this.getFolderNameText(entryId, this.selectedFolderPath);
    const nodeId = selectedNode.id;
    const repoId = (await this.repoClient.getCurrentRepoId());
    const waUrl = this.loginComponent.nativeElement.account_endpoints.webClientUrl;
    this.selectedNodeUrl = getEntryWebAccessUrl(nodeId, repoId, waUrl, selectedNode.isContainer);
    this.expandFolderBrowser = false;
  }

  get shouldShowSelect(): boolean {
    return !this.shouldShowOpen && !!this.lfRepositoryBrowser?.nativeElement?.currentFolder;
  }

  get shouldShowOpen(): boolean {
    return !!this.entrySelected;
  }

  onEntrySelected(event) {
    const customEvent = event as CustomEvent<LfTreeNode[]>;
    const treeNodesSelected: LfTreeNode[] = customEvent.detail;
    this.entrySelected = treeNodesSelected?.length > 0 ? treeNodesSelected[0] : undefined;
  }

  async onOpenNode() {
    await this.lfRepositoryBrowser?.nativeElement?.openSelectedNodesAsync();
  }

  async onClickBrowse() {
    this.expandFolderBrowser = true;
    await this.initializeTreeAsync();
  }

  get selectedFolderDisplayName(): string {
    const FOLDER_BROWSER_PLACEHOLDER = this.localizationService.getString('FOLDER_BROWSER_PLACEHOLDER');
    return this.selectedFolderName ?? FOLDER_BROWSER_PLACEHOLDER;
  }

  set selectedFolderDisplayName(folderName: string) {
    const FOLDER_BROWSER_PLACEHOLDER = this.localizationService.getString('FOLDER_BROWSER_PLACEHOLDER');
    this.selectedFolderName = folderName ?? FOLDER_BROWSER_PLACEHOLDER;
  }

  private getFolderNameText(entryId: number, path: string): string {
    if (path) {
      const displayPath: string = path;
      if (!entryId) {
        return displayPath;
      }
      else {
        const baseName: string = PathUtils.getLastPathSegment(displayPath);
        if (!baseName || baseName.length === 0) {
          return '\\';
        }
        else {
          return baseName;
        }
      }
    }
    else {
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
    const folderSelected: boolean = !!this.selectedFolderId;

    return fileSelected && folderSelected;
  }

  async onClickSave() {
    const valid = this.lfFieldContainerElement?.nativeElement?.forceValidation();
    if (valid) {
      const fileNameWithExtension = this.fileName + '.' + this.fileExtension;
      const edocBlob: FileParameter = { data: (this.fileSelected as Blob), fileName: fileNameWithExtension };
      const parentEntryId = this.selectedFolderId;

      const metadataRequest = await this.createMetadataRequestAsync();
      const entryRequest: PostEntryWithEdocMetadataRequest = new PostEntryWithEdocMetadataRequest({
        metadata: metadataRequest.metadata,
        template: metadataRequest.template
      });

      try {
        const repoId = await this.repoClient.getCurrentRepoId();
        console.log(repoId, parentEntryId, this.fileName, entryRequest)
        await this.repoClient.entriesClient.importDocument({
          repoId,
          parentEntryId,
          fileName: this.fileName,
          autoRename: true,
          electronicDocument: edocBlob,
          request: entryRequest
        });
        window.alert('Successfully saved document to Laserfiche')
      }
      catch (err: any) {
        console.error(err);
        window.alert(`${this.localizationService.getString('ERROR_SAVING')}: ${err.message}`)

      }
    }
    else {
      console.warn('metadata invalid');
      window.alert('One or more fields is invalid. Please fix and try again');
    }
  }

  private async createMetadataRequestAsync(): Promise<PostEntryWithEdocMetadataRequest> {
    const fieldValues = this.lfFieldContainerElement?.nativeElement.getFieldValues() ?? {};
    const templateName = this.lfFieldContainerElement?.nativeElement?.getTemplateValue()?.name ?? '';

    let formattedFieldValues: {
      [key: string]: FieldToUpdate;
    } | undefined = {};

    for (const key in fieldValues) {
      const value = fieldValues[key];
      formattedFieldValues[key] = new FieldToUpdate({ ...value, values: value.values.map(val => new ValueToUpdate(val)) });
    }

    const requestMetadata: PostEntryWithEdocMetadataRequest = this.getPostEntryRequest(templateName, formattedFieldValues);
    return requestMetadata;
  }

  private getPostEntryRequest(templateName: string | undefined, allFields: {
    [key: string]: FieldToUpdate;
  } | undefined): PostEntryWithEdocMetadataRequest {
    const entryRequest: PostEntryWithEdocMetadataRequest = new PostEntryWithEdocMetadataRequest({
      metadata: new PutFieldValsRequest({
        fields: allFields
      })
    });
    if (templateName && templateName.length > 0) {
      entryRequest.template = templateName;
    }
    return entryRequest;
  }

  // localization helpers

  BROWSE = this.localizationService.getString('BROWSE');
  FOLDER_BROWSER_PLACEHOLDER = this.localizationService.getString('FOLDER_BROWSER_PLACEHOLDER');
  SAVE_TO_LASERFICHE = this.localizationService.getString('SAVE_TO_LASERFICHE');
  CLICK_TO_UPLOAD = this.localizationService.getString('CLICK_TO_UPLOAD');
  SELECTED_FOLDER = this.localizationService.getString('SELECTED_FOLDER');
  FILE_NAME = this.localizationService.getString('FILE_NAME');
  OPEN_IN_LASERFICHE = this.localizationService.getString('OPEN_IN_LASERFICHE');
  SELECT = this.localizationService.getString('SELECT');
  CANCEL = this.localizationService.getString('CANCEL');

}
