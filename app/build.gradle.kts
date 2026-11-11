import java.util.Properties

plugins {
    id("com.android.application")
}

// One fixed key, so every new APK installs over the previous one.
// The key and its password stay off GitHub: keystore.properties + the .keystore file are git-ignored.
// Without them the release build is simply left unsigned (debug builds still work).
val ksProps = Properties().apply {
    val f = rootProject.file("keystore.properties")
    if (f.exists()) f.inputStream().use { s -> load(s) }
}
val hasKey = ksProps.getProperty("storeFile")?.let { rootProject.file(it).exists() } == true

android {
    namespace = "com.nabz.bazar"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.nabz.bazar"
        minSdk = 26
        targetSdk = 35
        versionCode = 6
        versionName = "1.5"
    }

    signingConfigs {
        if (hasKey) create("nabz") {
            storeFile = rootProject.file(ksProps.getProperty("storeFile"))
            storePassword = ksProps.getProperty("storePassword")
            keyAlias = ksProps.getProperty("keyAlias")
            keyPassword = ksProps.getProperty("keyPassword")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            if (hasKey) signingConfig = signingConfigs.getByName("nabz")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    androidResources {
        noCompress += listOf("woff2")
    }
}
