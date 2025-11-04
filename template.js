/// <reference path="./web-gtm-sandboxed-apis.d.ts" />

const callInWindow = require('callInWindow');
const copyFromWindow = require('copyFromWindow');
const getContainerVersion = require('getContainerVersion');
const getType = require('getType');
const injectScript = require('injectScript');
const JSON = require('JSON');
const logToConsole = require('logToConsole');
const setInWindow = require('setInWindow');

/*==============================================================================
==============================================================================*/

const scriptUrl = getScriptUrl(data);
const scriptGlobalFlagName = 'gtm_userDataCollectorScriptLoaded';
const scriptLoaded = copyFromWindow(scriptGlobalFlagName);

const settings = getScriptSettings(data);

if (!scriptLoaded || !scriptLoaded[scriptUrl]) {
  log({
    Name: 'UserDataCollector',
    Type: 'Message',
    Message: 'Loading User Data Collector script.'
  });

  injectScript(
    scriptUrl,
    () => {
      log({
        Name: 'UserDataCollector',
        Type: 'Message',
        Message: 'User Data Collector script loaded succesfully.'
      });
      const flagValue = scriptLoaded || {};
      flagValue[scriptUrl] = true;
      setInWindow(scriptGlobalFlagName, flagValue);

      log({
        Name: 'UserDataCollector',
        Type: 'Message',
        Message: 'User Data Collector script is already loaded. Running user data collection.'
      });

      runUserDataCollection(settings);
    },
    () => {
      log({
        Name: 'UserDataCollector',
        Type: 'Message',
        Message: 'User Data Collector script failed to load.'
      });

      data.gtmOnFailure();
    },
    scriptUrl
  );
} else {
  log({
    Name: 'UserDataCollector',
    Type: 'Message',
    Message: 'User Data Collector script is already loaded. Running user data collection.'
  });

  runUserDataCollection(settings);
}

/*==============================================================================
  Vendor related functions
==============================================================================*/

function getScriptUrl(data) {
  const scriptVersion = 'v1';
  const scriptUrl =
    getType(data.scriptUrl) === 'string'
      ? data.scriptUrl.replace('${script-version}', scriptVersion)
      : 'https://stapecdn.com/udc/' + scriptVersion + '.js';
  return scriptUrl;
}

function getScriptSettings(data) {
  const settings = {};

  settings.extract = {};
  if (data.email) settings.extract.email = data.email;
  if (data.phone) settings.extract.phone = data.phone;
  if (data.city) settings.extract.city = data.city;
  if (data.country) settings.extract.country = data.country;
  if (data.postalCode) settings.extract.postalCode = data.postalCode;
  if (data.firstName) settings.extract.firstName = data.firstName;
  if (data.lastName) settings.extract.lastName = data.lastName;

  if (data.overrideRootElement && data.overrideRootElementElement) {
    settings.root = data.overrideRootElementElement;
  }

  if (data.pushToDataLayer) {
    settings.pushToDataLayer = {
      enabled: true
    };
    if (getType(data.pushToDataLayerEventName) === 'string') {
      settings.pushToDataLayer.event = data.pushToDataLayerEventName;
    }
    if (getType(data.pushToDataLayerDataLayerName) === 'string') {
      settings.pushToDataLayer.dataLayerName = data.pushToDataLayerDataLayerName;
    }
  }

  if (data.autoTrackSpecificClicks) {
    settings.autoTrackSpecificClicks = {
      enabled: true
    };
    if (getType(data.autoTrackSpecificClicksSelector) === 'string') {
      settings.autoTrackSpecificClicks.buttonClickSelector = data.autoTrackSpecificClicksSelector;
    }
  }

  if (data.autoTrackSpecificForms) {
    settings.autoTrackSpecificForms = {
      enabled: true
    };
    if (getType(data.autoTrackSpecificFormsSelector) === 'string') {
      settings.autoTrackSpecificForms.formSelector = data.autoTrackSpecificFormsSelector;
    }
  }

  if (data.saveIntoStorage) {
    settings.saveIntoStorage = {
      enabled: true
    };
    if (data.saveIntoStorageType) settings.saveIntoStorage.type = data.saveIntoStorageType;
    if (getType(data.saveIntoStorageKey) === 'string') {
      settings.saveIntoStorage.key = data.saveIntoStorageKey;
    }
  }

  if (data.overrideExistingUserData) {
    settings.overrideExistingUserData = data.overrideExistingUserData;
  }

  return settings;
}

function runUserDataCollection(settings) {
  const userData = callInWindow('collectUserDataAuto', settings);
  log({
    Name: 'UserDataCollector',
    Type: 'Message',
    Message: 'Collected User Data: ' + JSON.stringify(userData)
  });

  data.gtmOnSuccess();
}

/*==============================================================================
  Helpers
==============================================================================*/

function log(dataToLog) {
  if (!determinateIsLoggingEnabled()) return;
  logToConsole(dataToLog);
}

function determinateIsLoggingEnabled() {
  const containerVersion = getContainerVersion();
  const isDebug = !!(
    containerVersion &&
    (containerVersion.debugMode || containerVersion.previewMode)
  );

  if (!data.logType) {
    return isDebug;
  }

  if (data.logType === 'no') {
    return false;
  }

  if (data.logType === 'debug') {
    return isDebug;
  }

  return data.logType === 'always';
}
