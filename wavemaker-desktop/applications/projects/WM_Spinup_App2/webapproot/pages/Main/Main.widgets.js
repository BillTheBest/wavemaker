Main.widgets = {
	LoginServiceVariable: ["wm.ServiceVariable", {"operation":"login","service":"SpinUpService"}, {"onResult":"LoginServiceVariableResult"}, {
		input: ["wm.ServiceInput", {"type":"loginInputs"}, {}, {
			binding: ["wm.Binding", {}, {}, {
				wire: ["wm.Wire", {"expression":undefined,"source":"UserName.dataValue","targetProperty":"username"}, {}],
				wire1: ["wm.Wire", {"expression":undefined,"source":"Password.dataValue","targetProperty":"password"}, {}]
			}]
		}]
	}],
	progressBarTimer: ["wm.Timer", {"delay":50}, {"onTimerFire":"progressBarTimerTimerFire"}],
	finishProgressBarTimer: ["wm.Timer", {"delay":50}, {"onTimerFire":"finishProgressBarTimerTimerFire"}],
	tipsVar: ["wm.Variable", {"isList":true,"json":"[\n\t{\n\t\t\"name\": \"resources/images/Tutorial.png\", \n\t\t\"dataValue\": \"There is a lot of functionality in WaveMaker.  To get started, work through a few  <a href='http://dev.wavemaker.com/wiki/bin/wmdoc_6.5/Tutorials' target='_blank'>Tutorials</a>\"\n\t}, \n\t{\n\t\t\"name\": \"resources/images/Variable.png\", \n\t\t\"dataValue\": \"When you see a component called a Variable, think of it as a data store or data model (in the MVC sense of model)\"\n\t}, \n\t{\n\t\t\"name\": \"resources/images/MobileGrid.png\", \n\t\t\"dataValue\": \"the DojoGrid widget can now be used on mobile browsers\"\n\t}, \n\t{\n\t\t\"name\": \"resources/images/Forums.png\", \n\t\t\"dataValue\": \"If you ever need extra help, check the <a href='http://dev.wavemaker.com/forums/' target='_blank'>forums</a> for advice or to hire extra help\"\n\t}, \n\t{\n\t\t\"name\": \"resources/images/ButtonProps.png\", \n\t\t\"dataValue\": \"To learn about basic widgets, drag a button onto your canvas, and try changing its properties, styles and events\"\n\t}\n]","type":"EntryData"}, {}],
	tipsTimer: ["wm.Timer", {"autoStart":true,"delay":12000}, {"onTimerFire":"tipsTimerTimerFire"}],
	LaunchStudioserviceVariable: ["wm.ServiceVariable", {"operation":"launchStudio","service":"SpinUpService"}, {"onError":"LaunchStudioserviceVariableError","onSuccess":"LaunchStudioserviceVariableSuccess"}, {
		input: ["wm.ServiceInput", {"type":"launchStudioInputs"}, {}]
	}],
	navigationCall1: ["wm.NavigationCall", {"operation":"gotoPageContainerPage"}, {}, {
		input: ["wm.ServiceInput", {"type":"gotoPageContainerPageInputs"}, {}, {
			binding: ["wm.Binding", {}, {}, {
				wire: ["wm.Wire", {"expression":"\"AdminPage\"","targetProperty":"pageName"}, {}],
				wire1: ["wm.Wire", {"expression":undefined,"source":"adminPC","targetProperty":"pageContainer"}, {}]
			}]
		}]
	}],
	layoutBox1: ["wm.Layout", {"horizontalAlign":"center","styles":{"color":"#ffffff"},"verticalAlign":"top","width":"1379px"}, {"onEnterKeyPress":"LogInButtonClick"}, {
		ParentPanel: ["wm.Panel", {"_classes":{"domNode":["largerLineHeight"]},"height":"100%","horizontalAlign":"left","styles":{"fontSize":"14px","color":"#3f3f3f","backgroundColor":"#f8f9f9","fontFamily":"Arial, Tahoma, Verdana, Helvetica, sans serif"},"verticalAlign":"top","width":"960px"}, {}, {
			BannerPanel: ["wm.Panel", {"height":"100px","horizontalAlign":"left","layoutKind":"left-to-right","verticalAlign":"top","width":"100%"}, {}, {
				panel1: ["wm.Panel", {"height":"100px","horizontalAlign":"left","layoutKind":"left-to-right","styles":{"backgroundColor":"#ffffff","backgroundGradient":{"direction":"vertical","startColor":"#6b83a5","endColor":"#546d8e","colorStop":50}},"verticalAlign":"top","width":"100%"}, {}, {
					Logo: ["wm.Picture", {"border":"0","height":"85px","margin":"0","padding":"12","source":"resources/images/logos/banner.png","width":"277px"}, {}],
					BannerSpacer1: ["wm.Spacer", {"height":"1px","width":"100%"}, {}],
					BannerLinks: ["wm.Label", {"_classes":{"domNode":["a"]},"autoSizeWidth":true,"border":"0","caption":"<a href=\"http://wavemaker.cloudfoundry.com\">Home</a>&nbsp;&nbsp;|&nbsp;&nbsp;FAQ&nbsp;&nbsp;|&nbsp;&nbsp;Help","height":"100%","padding":"4","styles":{"color":"#ffffff","textDecoration":"none","whiteSpace":"nowrap"},"width":"139px"}, {}],
					BannerSpacer2: ["wm.Spacer", {"height":"1px","width":"12px"}, {}]
				}]
			}],
			panel4: ["wm.Panel", {"height":"100%","horizontalAlign":"left","layoutKind":"left-to-right","margin":"25,25,5,25","minDesktopHeight":485,"minHeight":485,"styles":{"fontSize":"undefinedpx","color":"","backgroundColor":""},"verticalAlign":"top","width":"100%"}, {}, {
				TopLayers: ["wm.Layers", {}, {}, {
					loginLayer: ["wm.Layer", {"borderColor":"","caption":"layer1","horizontalAlign":"left","layoutKind":"left-to-right","margin":"0","padding":"0","themeStyleType":"","verticalAlign":"top"}, {}, {
						ContentPanel1: ["wm.Panel", {"_classes":{"domNode":["largerLineHeight"]},"height":"100%","horizontalAlign":"left","margin":"0","styles":{"backgroundColor":"","color":"","fontFamily":"Arial, Tahoma, Helvetica,Verdana,Sans Serif","fontSize":"undefinedpx"},"verticalAlign":"top","width":"65%"}, {}, {
							Content1: ["wm.Html", {"autoScroll":false,"border":"0","height":"32px","html":"WaveMaker for Cloud Foundry","margin":"0","minDesktopHeight":15,"styles":{"fontSize":"26px","color":""}}, {}],
							html1: ["wm.Html", {"_classes":{"domNode":["","largerLineHeight",""]},"autoScroll":false,"border":"0","height":"95px","html":"WaveMaker provides a fast, efficient and secure environment to develop and \ndeploy enterprise web and cloud applications. With WaveMaker's visual, drag \nand drop tools, any developer can start building enterprise Java applications \nwith minimal training. WaveMaker creates standard Java applications, boosting \ndeveloper productivity and quality without compromising flexibility. ","margin":"15,0,0,0","minDesktopHeight":15,"styles":{"color":"","fontSize":"undefinedpx"}}, {}],
							spacer2: ["wm.Spacer", {"height":"15px","width":"96px"}, {}],
							html2: ["wm.Html", {"_classes":{"domNode":["largerLineHeight"]},"autoScroll":false,"border":"0","height":"36px","html":"To begin using WaveMaker, sign in using your Cloud Foundry user name and password.","margin":"0,0,0,0","minDesktopHeight":15,"padding":"0,0,0,0","styles":{"fontSize":"undefinedpx"},"width":"65%"}, {}],
							error_warning_spacer_1: ["wm.Spacer", {"height":"16px","showing":false,"width":"96px"}, {}],
							labelError: ["wm.Label", {"_classes":{"domNode":["labelError"]},"autoSizeHeight":true,"border":"2","borderColor":"#cc0000","caption":"Unkown Error ","height":"36px","padding":"6","showing":false,"singleLine":false,"styles":{"fontSize":"undefinedpx","backgroundColor":""},"width":"78%"}, {}],
							labelWarning: ["wm.Label", {"_classes":{"domNode":["labelError"]},"autoSizeHeight":true,"border":"2","borderColor":"#ffb505","caption":"Unkown Error ","height":"36px","padding":"6","showing":false,"singleLine":false,"styles":{"fontSize":"undefinedpx","backgroundColor":"#ffffdd"},"width":"78%"}, {}],
							error_warning_spacer_2: ["wm.Spacer", {"height":"4px","showing":false,"width":"96px"}, {}],
							LoginPanel: ["wm.Panel", {"fitToContentHeight":true,"height":"142px","horizontalAlign":"left","margin":"15,0,0,0","verticalAlign":"top","width":"100%"}, {"onEnterKeyPress":"LoginServiceVariable"}, {
								label2: ["wm.Label", {"autoSizeHeight":true,"border":"0","caption":"Cloud Foundry Username","padding":"4","singleLine":false,"styles":{"fontSize":"undefinedpx"},"width":"100%"}, {}],
								UserName: ["wm.Text", {"_classes":{"domNode":["LoginInputs"]},"borderColor":"#bcbdbd","caption":undefined,"captionAlign":"left","captionPosition":"top","captionSize":"0px","dataValue":undefined,"desktopHeight":"32px","displayValue":"","height":"32px","minDesktopHeight":96,"padding":"0","required":true,"showMessages":false,"styles":{"backgroundColor":"","fontSize":"undefinedpx"}}, {}],
								spacer1: ["wm.Spacer", {"height":"15px","width":"96px"}, {}],
								label3: ["wm.Label", {"autoSizeHeight":true,"border":"0","caption":"Cloud Foundry Password","padding":"4","singleLine":false,"styles":{"fontSize":"undefinedpx"},"width":"100%"}, {}],
								Password: ["wm.Text", {"_classes":{"domNode":["LoginInputs"]},"borderColor":"#bcbdbd","caption":undefined,"captionAlign":"left","captionPosition":"top","captionSize":"0px","dataValue":undefined,"desktopHeight":"32px","displayValue":"","height":"32px","maxHeight":0,"minDesktopHeight":96,"padding":"0","password":true,"required":true,"showMessages":false}, {}]
							}],
							spacer3: ["wm.Spacer", {"height":"15px","width":"96px"}, {}],
							panel7: ["wm.Panel", {"fitToContentHeight":true,"height":"48px","horizontalAlign":"left","layoutKind":"left-to-right","verticalAlign":"top","width":"100%"}, {}, {
								LogInButton: ["wm.Button", {"border":"0","caption":"Log In","desktopHeight":"48px","height":"48px","margin":"4","styles":{"backgroundColor":"#ffffff","backgroundGradient":{"direction":"vertical","startColor":"#56a8d7","endColor":"#007cc2","colorStop":51},"fontSize":"20px","fontStyle":"normal","fontWeight":"normal","fontFamily":"Arial"},"width":"150px"}, {"onclick":"LogInButtonClick"}, {
									binding: ["wm.Binding", {}, {}, {
										wire: ["wm.Wire", {"expression":undefined,"source":"LoginPanel.invalid","targetProperty":"disabled"}, {}]
									}]
								}],
								spacer7: ["wm.Spacer", {"height":"10px","width":"10px"}, {}],
								label4: ["wm.Label", {"border":"0","caption":"Don't have a Cloud Foundry accout?  <a href=\"http://cloudfoundry.com/signup\" target=\"blank\">Sign up</a>","height":"100%","padding":"4","width":"100%"}, {}]
							}]
						}],
						ContentPanel2: ["wm.Panel", {"borderColor":"#fbfbfb","height":"100%","horizontalAlign":"left","styles":{"backgroundColor":""},"verticalAlign":"top","width":"35%"}, {}, {
							panel2: ["wm.Panel", {"height":"100%","horizontalAlign":"right","margin":"0","verticalAlign":"top","width":"100%"}, {}, {
								spacer4: ["wm.Spacer", {"height":"209px","width":"150px"}, {}],
								downloadWMPanel: ["wm.Panel", {"border":"2","borderColor":"#bcbdbd","fitToContentHeight":true,"height":"186px","horizontalAlign":"left","margin":"0","padding":"15,15,15,15","styles":{"backgroundColor":""},"verticalAlign":"top","width":"300px"}, {}, {
									html4: ["wm.Html", {"autoScroll":false,"border":"0","borderColor":"#e1d6d6","height":"96px","html":"Want to use WaveMaker on your \ndesktop?\n<br><br>\nDownload the latest version of \nWaveMaker to run on your Windows, \nMac, or Linux computer.","margin":"0","minDesktopHeight":15}, {}],
									spacer6: ["wm.Spacer", {"height":"20px","width":"96px"}, {}],
									panel6: ["wm.Panel", {"height":"36px","horizontalAlign":"center","layoutKind":"left-to-right","verticalAlign":"top","width":"100%"}, {}, {
										DownloadButton1: ["wm.Button", {"border":"0","borderColor":"#999999","caption":"Download WaveMaker","desktopHeight":"36px","height":"36px","margin":"4","styles":{"backgroundColor":"#ffffff","backgroundGradient":{"direction":"vertical","startColor":"#ffffff","endColor":"#dbdbdb","colorStop":50},"fontSize":"14px","fontStyle":"normal","fontWeight":"normal","fontFamily":"Arial","color":"#007cd3"},"width":"190px"}, {"onclick":"DownloadButton1Click"}]
									}]
								}]
							}]
						}]
					}],
					waitingLayer: ["wm.Layer", {"borderColor":"","caption":"layer1","horizontalAlign":"left","margin":"0","padding":"0","themeStyleType":"","verticalAlign":"top"}, {}, {
						progressBar1: ["wm.dijit.ProgressBar", {"height":"48px","padding":"0,20,0,20","progress":1,"width":"100%"}, {}],
						html3: ["wm.Html", {"_classes":{"domNode":["largerLineHeight"]},"border":"0","height":"64px","html":"Setting up your server, this may take a couple of minutes.","margin":"0,20,40,20","minDesktopHeight":15,"styles":{"fontSize":"undefinedpx"}}, {}],
						label5: ["wm.Label", {"_classes":{"domNode":["subheading"]},"border":"0","caption":"Tips:","padding":"4","width":"100%"}, {}],
						tipsHtmlPanel: ["wm.Panel", {"height":"100%","horizontalAlign":"left","layoutKind":"left-to-right","verticalAlign":"top","width":"100%"}, {}, {
							tipsHtml: ["wm.Html", {"_classes":{"domNode":["tips"]},"border":"0","height":"100%","margin":"20","minDesktopHeight":15,"styles":{"fontSize":"undefinedpx"}}, {}, {
								binding: ["wm.Binding", {}, {}, {
									wire: ["wm.Wire", {"expression":undefined,"source":"tipsVar.dataValue","targetProperty":"html"}, {}]
								}]
							}],
							tipsPic: ["wm.Picture", {"border":"0","height":"100%","margin":"20,0,20,0","width":"300px"}, {}, {
								binding: ["wm.Binding", {}, {}, {
									wire: ["wm.Wire", {"expression":undefined,"source":"tipsVar.name","targetProperty":"source"}, {}]
								}]
							}]
						}]
					}],
					adminLayer: ["wm.Layer", {"borderColor":"","caption":"layer1","horizontalAlign":"left","margin":"0","padding":"0","themeStyleType":"","verticalAlign":"top"}, {}, {
						adminLoginButton: ["wm.Button", {"caption":"Login","margin":"4"}, {"onclick":"navigationCall1"}],
						adminPC: ["wm.PageContainer", {"border":"0","deferLoad":true,"height":"50%"}, {}]
					}]
				}]
			}],
			NavBannerParent: ["wm.Panel", {"height":"80px","horizontalAlign":"left","layoutKind":"left-to-right","margin":"10,25,10,25","minDesktopHeight":90,"styles":{"color":""},"verticalAlign":"bottom","width":"100%"}, {}, {
				NavBannerPanel: ["wm.Panel", {"border":"2","borderColor":"#cccccc","height":"60px","horizontalAlign":"left","layoutKind":"left-to-right","margin":"0","padding":"0,25,0,25","styles":{"backgroundGradient":{"direction":"vertical","startColor":"#6b83a5","endColor":"#546d8e","colorStop":53},"color":"#ffffff"},"verticalAlign":"top","width":"100%"}, {}, {
					ExplorePanel: ["wm.Panel", {"height":"100%","horizontalAlign":"left","layoutKind":"left-to-right","margin":"0,0,0,0","verticalAlign":"middle","width":"25%"}, {}, {
						picture2: ["wm.Picture", {"border":"0","height":"24px","imageIndex":8,"imageList":"app.silkIconList","width":"24px"}, {}, {
							binding: ["wm.Binding", {}, {}, {
								wire: ["wm.Wire", {"expression":undefined,"source":"explore1.link","targetProperty":"link"}, {}]
							}]
						}],
						explore1: ["wm.Label", {"border":"0","caption":"<div style=\"color: white;\">Explore<br><div style=\"font-size: 9px;\">Gallery & Demos</div></div>","height":"36px","link":"http://www.wavemaker.com/product/demos.html","margin":"0,0,0,10","padding":"4","singleLine":false}, {}]
					}],
					WatchPanel: ["wm.Panel", {"height":"100%","horizontalAlign":"left","layoutKind":"left-to-right","margin":"0,0,0,0","verticalAlign":"middle","width":"25%"}, {}, {
						picture4: ["wm.Picture", {"border":"0","height":"24px","imageIndex":8,"imageList":"app.silkIconList","width":"24px"}, {}, {
							binding: ["wm.Binding", {}, {}, {
								wire: ["wm.Wire", {"expression":undefined,"source":"explore3.link","targetProperty":"link"}, {}]
							}]
						}],
						explore3: ["wm.Label", {"border":"0","caption":"<div style=\"color:white;\">Watch<br><div style=\"font-size: 9px\">Screencasts & Tutorials</div></div>","height":"36px","link":"http://www.wavemaker.com/product/screencasts.html","margin":"0,0,0,10","padding":"4","singleLine":false}, {}]
					}],
					ForumsPanel: ["wm.Panel", {"height":"100%","horizontalAlign":"left","layoutKind":"left-to-right","margin":"0,0,0,0","verticalAlign":"middle","width":"25%"}, {}, {
						picture5: ["wm.Picture", {"border":"0","height":"24px","imageIndex":8,"imageList":"app.silkIconList","width":"24px"}, {}, {
							binding: ["wm.Binding", {}, {}, {
								wire: ["wm.Wire", {"expression":undefined,"source":"explore4.link","targetProperty":"link"}, {}]
							}]
						}],
						explore4: ["wm.Label", {"border":"0","caption":"<div style=\"color:white;\">Forums<br><div style=\"font-size: 9px\">Discussions</div></div>","height":"36px","link":"http://dev.wavemaker.com/forums/","margin":"0,0,0,10","padding":"4","singleLine":false}, {}]
					}],
					WikiPanel: ["wm.Panel", {"height":"100%","horizontalAlign":"left","layoutKind":"left-to-right","margin":"0,0,0,0","verticalAlign":"middle","width":"25%"}, {}, {
						picture6: ["wm.Picture", {"border":"0","height":"24px","imageIndex":8,"imageList":"app.silkIconList","width":"24px"}, {}, {
							binding: ["wm.Binding", {}, {}, {
								wire: ["wm.Wire", {"expression":undefined,"source":"explore5.link","targetProperty":"link"}, {}]
							}]
						}],
						explore5: ["wm.Label", {"border":"0","caption":"<div style=\"color:white;\">Wiki<br><div style=\"font-size: 9px\">FAQ & Answers</div></div>","height":"36px","link":"http://dev.wavemaker.com/wiki/bin/view/Main/","margin":"0,0,0,10","padding":"4","singleLine":false}, {}]
					}]
				}]
			}],
			FooterPanel: ["wm.Panel", {"height":"26px","horizontalAlign":"center","styles":{"backgroundGradient":{"direction":"vertical","startColor":"#6d83a5","endColor":"#546d8e","colorStop":50}},"verticalAlign":"middle","width":"100%"}, {}, {
				label1: ["wm.Label", {"align":"center","border":"0","caption":"WaveMaker  |  Copyright © 2011-2012 SpringSource, a division of VMware, Inc. All rights reserved.","height":"23px","padding":"4","singleLine":false,"styles":{"color":"#ffffff","fontSize":"9px"},"width":"100%"}, {}]
			}]
		}]
	}]
}