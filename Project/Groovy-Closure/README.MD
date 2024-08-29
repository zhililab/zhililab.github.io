在 Jenkins 中使用共享库（Shared Library）是实现代码重用和模块化的好方法。下面是如何演示将 Groovy 闭包函数抽离到共享库，并在 Pipeline 中调用它们的步骤和示例代码。

### **1. 创建共享库**

首先，我们需要在你的 Git 仓库中创建一个共享库。共享库是一个包含 Groovy 脚本的 Git 仓库，这些脚本可以被多个 Jenkins Pipelines 共享。

#### **目录结构**
```plaintext
(my-shared-library)
├── vars
│   ├── compile.groovy
│   ├── runTests.groovy
│   └── deploy.groovy
└── src
    └── org
        └── example
            └── Utils.groovy
```

> 选择 `vars` 当你需要定义简单、直接调用的函数或自定义 Pipeline 步骤时，适合功能独立且不复杂的场景。选择 `src` 当你需要实现复杂逻辑、创建可重用的类和工具库，或需要使用面向对象编程特性（如继承、封装）时。

#### **定义共享库函数**

在 `vars` 目录中创建以下文件：

**1. `vars/compile.groovy`**
```groovy
def call(String project) {
    echo "Compiling ${project}..."
    sh "mvn -f ${project}/pom.xml clean install"
}
```

**2. `vars/runTests.groovy`**
```groovy
def call(String project) {
    echo "Running tests for ${project}..."
    sh "mvn -f ${project}/pom.xml test"
}
```

**3. `vars/deploy.groovy`**
```groovy
def call(String project, String environment) {
    echo "Deploying ${project} to ${environment}..."
    sh "scp target/${project}.war user@${environment}:/deploy/path/"
}
```

#### **配置 Jenkins**

1. **在 Jenkins 中配置共享库**：
   - 转到 Jenkins 管理界面 -> 管理 Jenkins -> 配置系统。
   - 在 “Global Pipeline Libraries” 部分，添加新的共享库。
   - 输入库的名称、源代码管理（例如 Git 仓库 URL）以及其他必要的配置信息。

### **2. 使用共享库**

在你的 Jenkins Pipeline 中，我们可以像使用本地定义的函数一样使用这些共享库函数。

```groovy
// Jenkinsfile
@Library('my-shared-library') _

pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                script {
                    // 使用共享库中的 compile 闭包
                    compile("ZhiProject")
                }
            }
        }

        stage('Test') {
            steps {
                script {
                    // 使用共享库中的 runTests 闭包
                    runTests("ZhiProject")
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    // 使用共享库中的 deploy 闭包
                    deploy("ZhiProject", "production-server")
                }
            }
        }
    }
}
```

### **代码说明**

1. **共享库中的定义**：
   - 在 `vars` 目录中的每个 Groovy 脚本文件定义了一个闭包函数。函数名与文件名相同，并且可以直接在 Pipeline 脚本中调用。

2. **在 Pipeline 中使用共享库**：
   - 在 Pipeline 脚本的开头，使用 `@Library('my-shared-library') _` 导入共享库。
   - 然后在 `stages` 中，可以直接调用共享库中定义的函数（如 `compile`、`runTests` 和 `deploy`）。

3. **优势**：
   - **模块化**：将通用功能提取到共享库中，使得 Pipeline 脚本更加简洁。
   - **重用性**：共享库中的函数可以被多个 Pipeline 使用，减少重复代码。
   - **维护性**：更新共享库中的函数时，所有使用该库的 Pipeline 都会自动受益于更新。

通过这种方式，我们可以将复杂的操作模块化，并在多个 Jenkins Pipelines 中重用，提高了 CI/CD 管道的灵活性和可维护性。