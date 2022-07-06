import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { PostEntryWithEdocMetadataRequest, FileParameter, RepositoryApiClient, IRepositoryApiClient, PutFieldValsRequest, IPutFieldValsRequest, FieldToUpdate, ValueToUpdate } from '@laserfiche/lf-repository-api-client';
import { LfFolder, LfFieldsService, LfRepoTreeService, LfRepoTreeEntryType, IRepositoryApiClientEx } from '@laserfiche/lf-ui-components-services';
import { LfLocalizationService, PathUtils } from '@laserfiche/lf-js-utils';
import { LfFieldContainerComponent, LfFolderBrowserComponent, LfLoginComponent, LoginState, TreeNode } from '@laserfiche/types-lf-ui-components';
import { getEntryWebAccessUrl } from './lf-url-utils';

const resources: Map<string, object> = new Map<string, object>([
  ['en', {
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
  selectedFolder?: LfFolder;

  // used to get the file user is trying to save
  @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>;

  // the UI components
  @ViewChild('lfFieldContainerElement') lfFieldContainerElement?: ElementRef<LfFieldContainerComponent>;
  @ViewChild('loginComponent') loginComponent?: ElementRef<LfLoginComponent>;
  @ViewChild('lfFolderBrowserElement') lfFolderBrowserElement?: ElementRef<LfFolderBrowserComponent>;

  // services needed for UI components
  lfFieldsService?: LfFieldsService;
  lfRepoTreeService?: LfRepoTreeService;

  // localization service from lf-js-utils
  localizationService = new LfLocalizationService(resources);

  // determines if the folder browser should be expanded
  expandFolderBrowser: boolean;

  fileSelected?: File;
  fileName?: string;
  fileExtension?: string;

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
      this.lfRepoTreeService = new LfRepoTreeService(this.repoClient);
      // by default all entries are viewable
      this.lfRepoTreeService.viewableEntryTypes = [LfRepoTreeEntryType.Folder, LfRepoTreeEntryType.ShortcutFolder];

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
            console.log('getting id from cache')
            return this.repoClient._repoId
          }
          else {
            console.log('getting id from api')
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
    await this.lfFolderBrowserElement?.nativeElement.initAsync({
      treeService: this.lfRepoTreeService
    });
  }

  get isLoggedIn(): boolean {
    return this.loginComponent?.nativeElement?.state === LoginState.LoggedIn;
  }

  // Tree event handler methods
  async onOkClick(okClickEvent: Event) {
    const selectedNode = (okClickEvent as CustomEvent<TreeNode>).detail;
    const breadcrumbs = this.lfFolderBrowserElement?.nativeElement?.breadcrumbs;
    const entryId = Number.parseInt(selectedNode.id, 10);
    const path = selectedNode.path;
    this.selectedFolder = {
      entryId,
      path,
      displayName: this.getFolderNameText(entryId, path),
      displayPath: this.getFolderPathTooltip(path)
    };
    if (breadcrumbs) {
      this.selectedFolder.breadcrumbs = breadcrumbs;
    }
    const nodeId = selectedNode.id;
    const repoId = (await this.repoClient.getCurrentRepoId());
    const waUrl = this.loginComponent.nativeElement.account_endpoints.webClientUrl;
    this.selectedNodeUrl = getEntryWebAccessUrl(nodeId, repoId, waUrl, selectedNode.isContainer);
    this.expandFolderBrowser = false;
  }

  async onClickBrowse() {
    this.expandFolderBrowser = true;
    await this.initializeTreeAsync();
  }

  private getFolderPathTooltip(path: string): string {
    const FOLDER_BROWSER_PLACEHOLDER = this.localizationService.getString('FOLDER_BROWSER_PLACEHOLDER');
    return path ? PathUtils.createDisplayPath(path) : FOLDER_BROWSER_PLACEHOLDER;
  }

  get selectedFolderDisplayName(): string {
    const FOLDER_BROWSER_PLACEHOLDER = this.localizationService.getString('FOLDER_BROWSER_PLACEHOLDER');
    return this.selectedFolder?.displayName ?? FOLDER_BROWSER_PLACEHOLDER;
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
    const folderSelected: boolean = !!this.selectedFolder;

    return fileSelected && folderSelected;
  }

  async onClickSave() {
    const valid = this.lfFieldContainerElement?.nativeElement?.forceValidation();
    if (valid) {
      const fileNameWithExtension = this.fileName + '.' + this.fileExtension;
      const edocBlob: FileParameter = { data: (this.fileSelected as Blob), fileName: fileNameWithExtension };
      const parentEntryId = this.selectedFolder.entryId;

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
