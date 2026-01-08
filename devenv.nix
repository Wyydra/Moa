{ pkgs, lib, config, inputs, ... }:

let
  pkgs' = import inputs.nixpkgs {
    inherit (pkgs) system;
    config = {
      android_sdk.accept_license = true;
      allowUnfree = true;
    };
  };
  
  buildToolsVersion = "34.0.0";
  
  androidComposition = pkgs'.androidenv.composeAndroidPackages {
    buildToolsVersions = [ buildToolsVersion "35.0.0" "36.0.0" ];
    platformVersions = [ "36" ];
    includeEmulator = false;
    includeNDK = true;
    ndkVersions = [ "27.1.12297006" ];
    cmakeVersions = [ "3.22.1" ];
    includeSources = false;
    includeSystemImages = false;
    extraLicenses = [
      "android-sdk-license"
      "android-sdk-preview-license"
    ];
  };
  
  androidSdk = androidComposition.androidsdk;
in
{
  packages = with pkgs; [ 
    just
    watchman
    jdk17
    gradle_8
    android-tools
    ngrok
  ];

  env.JAVA_HOME = "${pkgs.jdk17}/lib/openjdk";
  env.ANDROID_HOME = "${androidSdk}/libexec/android-sdk";
  env.GRADLE_OPTS = "-Dorg.gradle.project.android.aapt2FromMavenOverride=${androidSdk}/libexec/android-sdk/build-tools/${buildToolsVersion}/aapt2";

  languages.typescript.enable = true;
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs;
  };

  enterShell = ''
    echo "Moa development environment"
    echo "Node: $(node --version)"
    echo "npm: $(npm --version)"
  '';
}
