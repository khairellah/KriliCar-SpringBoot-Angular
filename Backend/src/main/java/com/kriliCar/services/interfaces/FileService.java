package com.kriliCar.services.interfaces;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface FileService {

    // Enregistre un fichier dans le sous-dossier spécifié (ex: "Client") et retourne le chemin BDD
    String uploadFile(MultipartFile file, String subDirectory) throws IOException;

    // Supprime un fichier en utilisant le chemin relatif stocké en BDD
    void deleteFile(String relativePath);
}