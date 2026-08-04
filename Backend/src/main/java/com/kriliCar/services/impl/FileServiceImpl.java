package com.kriliCar.services.impl;

import com.kriliCar.services.interfaces.FileService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@Slf4j
public class FileServiceImpl implements FileService {

    @Value("${file.upload.dir}")
    private String uploadDir;

    @Override
    public String uploadFile(MultipartFile file, String subDirectory) throws IOException {

        // 1. Nettoyer et définir un nom de fichier unique (UUID)
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        // Utiliser la dernière partie du nom de fichier pour l'extension
        String fileExtension = "";
        int i = originalFilename.lastIndexOf('.');
        if (i > 0) {
            fileExtension = originalFilename.substring(i);
        }

        String newFilename = UUID.randomUUID().toString() + fileExtension;

        // 2. Définir le chemin cible (ex: ./uploads/Client)
        // Normaliser le chemin assure qu'il n'y a pas de problème de chemins relatifs
        Path targetLocation = Paths.get(uploadDir, subDirectory).toAbsolutePath().normalize();

        // Créer le répertoire s'il n'existe pas
        Files.createDirectories(targetLocation);

        // 3. Copier le fichier
        Path destination = targetLocation.resolve(newFilename);
        Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

        // 4. Retourner le chemin RELATIF pour la BDD (ex: cars/uuid.jpg)
        // **CORRECTION/STANDARDISATION** : Retirer le slash initial pour coller au format "subdirectory/filename"
        return subDirectory + "/" + newFilename;
    }

    @Override
    public void deleteFile(String relativePath) {
        if (relativePath == null || relativePath.isEmpty()) return;

        try {
            // Reconstruit le chemin absolu à partir du chemin relatif stocké en BDD
            // L'appel à resolve(relativePath) doit fonctionner si le chemin relatif ne commence pas par un séparateur
            Path filePath = Paths.get(uploadDir).resolve(relativePath).toAbsolutePath().normalize();

            if (Files.exists(filePath) && Files.isRegularFile(filePath)) {
                Files.delete(filePath);
                log.info("Fichier supprimé: {}", relativePath);
            } else {
                log.warn("Tentative de suppression, mais le fichier n'existe pas: {}", relativePath);
            }
        } catch (IOException e) {
            log.error("Impossible de supprimer le fichier: {}", relativePath, e);
        }
    }
}