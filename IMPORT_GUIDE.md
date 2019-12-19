# About
Streams upgrade guide using brazil third party system


# Prerequisite
* Get the Brazil third party tool installed on your machine -  follow the instructions here https://w.amazon.com/index.php/BuilderTools/Product/BrazilThirdPartyTool/UserGuide

# Steps 

* With in your workspace use the below command to pull the latest release version. (check the available releases here https://github.com/aws/amazon-connect-streams/releases)

 ``` 
 brazil-third-party-tool \
   --import \
   --external-name AmazonConnectStreams\
   --external-version 1.2.0 \
   --from https://github.com/aws/amazon-connect-streams.git \
   --at v1.2.0

cd src/AmazonConnectStreams

#Remove build tools - as we are going to use npm-pretty-much
git rm -r build-tools 

# move src to main folder
git mv third-party-src/* .

# remove the  third-party-src folder once it is copied to main folder
git rm -rf third-party-src
```

* Update the config file  to use newer build system to work with brazil

```
# If the current branch does not yet exist in Brazil, you can create and push
# it simultaneously using the following command:
# 'git push -u origin BRANCH_NAME_HERE'

package.AmazonConnectStreams = {
  # Please read http://tiny/inaap63w/3PMajorVersionScheme before changing the
  # suggested major version.
  interfaces = (1.x);
  scope = third-party;

  third-party-configuration = {
    # This is important, please do not remove it.
    thirdPartyName       = "AmazonConnectStreams";
    thirdPartyVersion    = "<<imported release version>>";  # ex - "1.2.0"
    licenseType          = (MIT); # 
    licenseFile          = (third-party-src/LICENSE.txt);
    repository           = "raw";
    downloadType         = "unknown";
  };

  build-system = npm-pretty-much;

  build-tools = {
    1.x = {
      NpmPrettyMuch = 1.0;
      NodeJS = 8.x;
    };
  };

  targets = {
    AmazonConnectStreams = {
      type = thirdparty;
    };
  };
};
# vim: set ft=perl ts=2 sw=2 tw=79 :

```

* Run bb release and validate the build

```
bb release
```

* Create CR 

```
brazil-third-party-tool --create-code-review

# When promted provide the ticket id  -  https://tt.amazon.com/0178208388

```

* Add 2 reviewers from your team and Once approved please merge the changes on CRUX


# References

* https://w.amazon.com/index.php/BuilderTools/Product/BrazilThirdPartyTool/UserGuide
* https://w.amazon.com/index.php/NodeJS/ThirdPartyLibraries#Manual_Instructions
* https://w.amazon.com/index.php/BuilderTools/Product/BrazilThirdPartyTool/UserGuide



