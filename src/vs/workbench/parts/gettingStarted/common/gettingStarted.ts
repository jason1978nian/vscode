/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import {IWindowService}from 'vs/workbench/services/window/electron-browser/windowService';
import {IWorkbenchContribution} from 'vs/workbench/common/contributions';
import {IWorkspaceContextService} from 'vs/workbench/services/workspace/common/contextService';
import {IStorageService} from 'vs/platform/storage/common/storage';
import {ITelemetryService, ITelemetryInfo} from 'vs/platform/telemetry/common/telemetry';

/**
 * This extensions handles the first launch expereince for new users
 */
export class GettingStarted implements IWorkbenchContribution {
	protected static hideWelcomeSettingskey = 'workbench.hide.welcome';

	protected welcomePageURL: string;
	protected appName: string;

	constructor(
		@IStorageService private storageService: IStorageService,
		@IWorkspaceContextService private contextService: IWorkspaceContextService,
		@ITelemetryService private telemetryService: ITelemetryService,
		@IWindowService private windowService: IWindowService
	) {
		const env = contextService.getConfiguration().env;
		this.appName = env.appName;

		if (env.welcomePage && !env.extensionTestsPath /* do not open a browser when we run tests */) {
			this.welcomePageURL =  env.welcomePage;
			this.handleWelcome();
		}
	}

	protected handleWelcome(): void {
		if (!navigator.onLine) {
			//make sure the user is online, otherwise refer to the next run to show the welcome page
			return;
		}

		let firstStartup = !this.storageService.get(GettingStarted.hideWelcomeSettingskey);

		// Don't open the welcome page as the root user on Linux, this is due to a bug with xdg-open
		// which recommends against running itself as root.
		if (firstStartup && this.welcomePageURL) {
			this.telemetryService.getTelemetryInfo().then(info=>{
				let url = this.getUrl(info);
				if (this.windowService.openExternal(url)) {
					this.storageService.store(GettingStarted.hideWelcomeSettingskey, true);
				}
			});
		}
	}

	private getUrl(telemetryInfo: ITelemetryInfo): string {
		return `${this.welcomePageURL}&&from=${this.appName}&&id=${telemetryInfo.machineId}`;
	}

	public getId(): string {
		return 'vs.gettingstarted';
	}
}