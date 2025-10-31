# User Data Extractor Tag for Google Tag Manager Web

This tag automatically extracts user PII (email, phone, name, etc.) from a webpage's DOM. It intelligently identifies form fields, normalizes the data, and can push the results to the dataLayer or browser storage. This is particularly useful for populating `user_data` parameters for various advertising and analytics tags.

## Features

- **Automatic Data Extraction**: Intelligently scans the page to find and extract user data from form fields and other HTML elements.
- **Configurable Data Points**: Choose to extract email, phone, first name, last name, city, country, and postal code.
- **DataLayer Integration**: Pushes a customizable event to the dataLayer containing the extracted user data.
- **Browser Storage**: Saves the extracted data to Session or Local Storage for persistence across pages.
- **Auto-Click Tracking**: Automatically triggers data extraction upon clicks on submit buttons or other specified elements.
- **Custom Scope**: Limit the DOM scanning to a specific container element instead of the entire document.
- **Debug and Logging**: Control logging to the console for easy debugging during setup.

## How to use it

1.  Add the **User Data Extractor From Page** tag to your GTM container from the Community Template Gallery.
2.  Create a new tag in your workspace and select the "User Data Extractor From Page" tag.
3.  Configure the settings as described below.
4.  Set up a trigger for when you want the extraction to run (e.g., on page views, after a form interaction, or on a custom event).

## Tag Configuration

### User Data to be Extracted

Select the checkboxes for the user data you wish to extract from the page.

- Email
- Phone
- City
- Country
- Postal Code
- First Name
- Last Name

### Extraction Settings

-   **Save user_data information into the browser Storage**:
    -   **Storage Type**: Choose `Session Storage` (data persists for the page session) or `Local Storage` (data persists until cleared).
    -   **Storage Key**: The key used to store the data. Defaults to `gtm_user_data`.

-   **Push an event to the dataLayer with user_data information**:
    -   **Data Layer Event Name**: The name of the event pushed to the dataLayer. Defaults to `user_data_detected`.
    -   **Data Layer Array Name**: The name of your dataLayer. Defaults to `dataLayer`.

-   **Automatically track clicks at specific HTML elements**:
    -   **Auto Track Submit Clicks Override CSS Selector**: Specify a CSS selector for elements that should trigger data extraction on click. If left blank, it defaults to `button[type="submit"]` and `input[type="submit"]`.

-   **Override the root HTML element to scan within**:
    -   **Overridden root HTML element**: Provide a GTM variable that returns an HTML element. The tag will only scan within this element. By default, it scans the entire `document`.

### More Settings

-   **Script URL**: The URL from which to load the extractor script.
    -   The default URL is `https://cdn.stape.io/user-data-extractor/${script-version}.js`.
    -   The `${script-version}` placeholder ensures you always use the latest version. You can replace it with a specific version (e.g., `v1`) to lock it.

### Logs Settings

Control the verbosity of the tag's logging in the browser's developer console.

-   **Do not log**: No messages will be logged.
-   **Log to console during debug and preview**: (Default) Logs will only appear when using GTM's Preview and Debug mode.
-   **Always log to console**: Logs will appear for all users.

## Open Source

The **User Data Extractor Tag for GTM Web** is developed and maintained by the [Stape Team](https://stape.io/) under the Apache 2.0 license.
