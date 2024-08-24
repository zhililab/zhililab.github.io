title: Docker 学习 —— 基础指令对比学习
author: Zhi Li
tags:
  - Docker
categories:
  - 技术
index_img: /assets/images/cover/Docker_Cover.png
date: 2024-08-13 23:17:00
---

## Docker 基础指令对比与关键概念

在 Docker 中，理解和区分不同的指令和概念对于构建高效的容器化应用至关重要，最近面试就有被问到 entrypoint 和 cmd 二者区别。Docker 种还有很多类似概念和指令，特借此机会梳理对比一些常见的 Docker 指令，如 `ENTRYPOINT` vs `CMD`，以及其他类似的操作，帮助自己更好地掌握 Docker 的使用和深入学习。

### `ENTRYPOINT` vs `CMD`

- **`ENTRYPOINT`**：定义容器启动时要执行的固定命令，通常不易被覆盖。适用于需要定义一个始终执行的命令的场景。
  - **示例**：
    ```Dockerfile
    ENTRYPOINT ["python", "app.py"]
    ```
    在这个例子中，容器启动时会执行 `python app.py`。

- **`CMD`**：提供默认的命令或参数，可以被用户在运行容器时覆盖。通常与 `ENTRYPOINT` 搭配使用，为 `ENTRYPOINT` 提供默认参数。
  - **示例**：
    ```Dockerfile
    CMD ["app.py", "--help"]
    ```
    如果没有设置 `ENTRYPOINT`，容器启动时会执行 `app.py --help`。

总结：
    •	CMD 指定容器的默认命令，且可以被覆盖。
	•	ENTRYPOINT 指定容器的主命令，通常不可被覆盖。
    •	此外，还有 RUN 是在镜像构建阶段执行的，而 CMD 和 ENTRYPOINT 是在容器启动时执行的。

思考：
    为什么要区分 entrypoint 和 cmd，从设计理念来说 —— ENTRYPOINT：定义容器的主要入口点，通常用于指定一个固定的命令，这些命令是属于关键命令，需要确保不可以被篡改或覆盖；CMD 更像是一个建议，用于指定当用户没有明确命令时，容器应该执行什么。同时提供 entrypoint 和 cmd 兼顾灵活性和准确性，适应各种使用场景。

### `COPY` vs `ADD`

- **`COPY`**：将文件或目录从构建上下文复制到镜像中，仅用于简单的文件复制。
  - **示例**：
    ```Dockerfile
    COPY ./src /app/src
    ```

- **`ADD`**：功能更强大，不仅可以复制文件，还可以解压归档文件或从 URL 下载内容。
  - **示例**：
    ```Dockerfile
    ADD ./src /app/src
    ADD https://example.com/file.tar.gz /app/
    ```

### `EXPOSE` vs `-p`

- **`EXPOSE`**：声明容器暴露的端口，用于文档说明，不会自动映射到主机端口。
  - **示例**：
    ```Dockerfile
    EXPOSE 80
    ```

- **`-p`**：在启动容器时将容器的端口映射到主机端口，以便从外部访问容器服务。
  - **示例**：
    ```sh
    docker run -p 8080:80 myimage
    ```

### `ENV` vs `ARG`

- **`ENV`**：定义容器运行时可用的环境变量。
  - **示例**：
    ```Dockerfile
    ENV NODE_ENV=production
    ```

- **`ARG`**：定义构建时可用的参数，仅在镜像构建期间有效。
  - **示例**：
    ```Dockerfile
    ARG VERSION=1.0
    RUN echo $VERSION
    ```

### `VOLUME` vs `--mount` vs `-v`

- **`VOLUME`**：声明容器中需要持久化的挂载点，Docker 会自动管理数据卷。
  - **示例**：
    ```Dockerfile
    VOLUME /data
    ```

- **`--mount`**：为容器指定挂载点，支持更复杂的挂载选项，语法更明确。
  - **示例**：
    ```sh
    docker run --mount type=bind,source=/host/path,target=/container/path
    ```

- **`-v`**：较旧的挂载语法，功能上与 `--mount` 类似，但语法不如 `--mount` 明确。
  - **示例**：
    ```sh
    docker run -v /host/path:/container/path
    ```

## 总结

通过以上对比，我们可以更清楚地理解 Docker 各个指令的用途及其差异。合理使用这些指令和概念，将帮助我们构建更高效和更灵活的容器化应用。