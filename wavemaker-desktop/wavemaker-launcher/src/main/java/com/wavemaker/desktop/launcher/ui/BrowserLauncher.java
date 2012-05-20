/*
 * Copyright (C) 2012 VMWare, Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

package com.wavemaker.desktop.launcher.ui;

/////////////////////////////////////////////////////////
//Bare Bones Browser Launch                            //
//Version 1.5 (December 10, 2005)                      //
//By Dem Pilafian                                      //
//Supports: Mac OS X, GNU/Linux, Unix, Windows XP      //
//Example Usage:                                       //
// String url = "http://www.centerkey.com/";           //
// BareBonesBrowserLaunch.openURL(url);		       //
//Public Domain Software -- Free to Use as You Like    //
/////////////////////////////////////////////////////////

import java.lang.reflect.Method;
import java.net.URL;

import javax.swing.JOptionPane;

public class BrowserLauncher {

    private static final String errMsg = "Error attempting to launch web browser";

    public static void main(String[] args) {
        final String b2 = "C:\\Documents and Settings\\cconover\\Local Settings\\Application Data\\Google\\Chrome\\Application\\chrome.exe";
        openURL("http://localhost:8094/wavemaker/", b2);
    }

    public static void openURL(String url) {
        openURL(url, null);
    }

    public static void openURL(String url, String browserPath) {
        String osName = System.getProperty("os.name");
        try {
            if (browserPath != null) {
                Runtime.getRuntime().exec(new String[] { browserPath, url });
            } else if (osName.startsWith("Mac OS")) {
                Class<?> fileMgr = Class.forName("com.apple.eio.FileManager");

                Method openURL = fileMgr.getDeclaredMethod("openURL", new Class[] { String.class });

                openURL.invoke(null, new Object[] { url });
            } else if (osName.startsWith("Windows")) {
                Runtime.getRuntime().exec("rundll32 url.dll,FileProtocolHandler " + url);
            } else // assume Unix or Linux
            {
                String[] browsers = {
                    // this uses the first browser it finds - is there a way to get the default browser for UNIX/Linux?
                    "chrome", "firefox", "opera", "konqueror", "epiphany", "mozilla", "netscape" };
                String browser = null;
                for (int count = 0; count < browsers.length && browser == null; count++) {
                    if (Runtime.getRuntime().exec(new String[] { "which", browsers[count] }).waitFor() == 0) {
                        browser = browsers[count];
                    }
                }
                if (browser == null) {
                    throw new Exception("Could not find web browser");
                } else {
                    Runtime.getRuntime().exec(new String[] { browser, url });
                }
            }
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, errMsg + ":\n" + e.getLocalizedMessage());
        }
    }

    public static void openURL(URL target) {
        openURL(target.toString());
    }

    public static void openURL(URL target, String browser) {
        openURL(target.toString(), browser);
    }
}
