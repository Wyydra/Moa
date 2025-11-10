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
    buildToolsVersions = [ buildToolsVersion "35.0.0" ];
    platformVersions = [ "36" ];
    includeEmulator = false;
    includeNDK = false;
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
    watchman
    # jdk17
    # cacert
  ];

  env.ANDROID_HOME = "${androidSdk}/libexec/android-sdk";
  # env.ANDROID_SDK_ROOT = "${androidSdk}/libexec/android-sdk";

  languages.typescript.enable = true;
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs;
  };

  # https://devenv.sh/basics/
  enterShell = ''
    echo "Moa development environment"
    echo "Node: $(node --version)"
    echo "npm: $(npm --version)"
  '';
}
