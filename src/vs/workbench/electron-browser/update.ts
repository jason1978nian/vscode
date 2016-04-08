/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import nls = require('vs/nls');
import severity from 'vs/base/common/severity';
import {TPromise} from 'vs/base/common/winjs.base';
import {Action} from 'vs/base/common/actions';
import {ipcRenderer as ipc} from 'electron';
import {IMessageService} from 'vs/platform/message/common/message';
import {IWorkspaceContextService} from 'vs/workbench/services/workspace/common/contextService';
import {IRequestService} from 'vs/platform/request/common/request';
import {IWindowService}from 'vs/workbench/services/window/electron-browser/windowService';

interface IUpdate {
	releaseNotes: string;
	version: string;
	date: string;
}

const ApplyUpdateAction = new Action(
	'update.applyUpdate',
	nls.localize('updateNow', "Update Now"),
	null,
	true,
	() => { ipc.send('vscode:update-apply'); return TPromise.as(true); }
);

const NotNowAction = new Action(
	'update.later',
	nls.localize('later', "Later"),
	null,
	true,
	() => TPromise.as(true)
);

export const ShowReleaseNotesAction = (windowService: IWindowService, releaseNotesUrl: string, returnValue = false) => new Action(
	'update.showReleaseNotes',
	nls.localize('releaseNotes', "Release Notes"),
	null,
	true,
	() => { windowService.openExternal(releaseNotesUrl); return TPromise.as(returnValue); }
);

export const DownloadAction = (windowService: IWindowService, url: string) => new Action(
	'update.download',
	nls.localize('downloadNow', "Download Now"),
	null,
	true,
	() => { windowService.openExternal(url); return TPromise.as(true); }
);

export class Update {

	constructor(
		@IWorkspaceContextService private contextService : IWorkspaceContextService,
		@IMessageService private messageService : IMessageService,
		@IRequestService private requestService : IRequestService,
		@IWindowService private windowService : IWindowService
	) {
		const env = this.contextService.getConfiguration().env;

		ipc.on('vscode:update-downloaded', (event, update: IUpdate) => {
			this.messageService.show(severity.Info, {
				message: nls.localize('updateAvailable', "{0} will be updated after it restarts.", env.appName),
				actions: [ShowReleaseNotesAction(this.windowService, env.releaseNotesUrl), NotNowAction, ApplyUpdateAction]
			});
		});

		ipc.on('vscode:update-available', (event, url: string) => {
			this.messageService.show(severity.Info, {
				message: nls.localize('thereIsUpdateAvailable', "There is an available update."),
				actions: [ShowReleaseNotesAction(this.windowService, env.releaseNotesUrl), NotNowAction, DownloadAction(this.windowService, url)]
			});
		});

		ipc.on('vscode:update-not-available', () => {
			this.messageService.show(severity.Info, nls.localize('noUpdatesAvailable', "There are no updates currently available."));
		});
	}
}
