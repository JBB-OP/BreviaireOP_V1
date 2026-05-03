// Fonctions pour gérer le Martyrologe

// Variable globale pour stocker les données des saints
var saintsData = null;

// Fonction pour charger les données des saints
// Utilise une approche qui fonctionne à la fois localement et sur serveur
function loadSaintsData() {
    if (saintsData) {
        console.log('Utilisation des données des saints déjà chargées');
        return Promise.resolve(saintsData);
    }
    
    return new Promise((resolve, reject) => {
        // En environnement local (file://), utiliser directement les données intégrées
        if (window.location.protocol === 'file:') {
            console.log('Environnement local détecté, utilisation des données intégrées');
            if (typeof integratedSaintsData !== 'undefined') {
                saintsData = integratedSaintsData;
                console.log('Données intégrées chargées avec succès:', saintsData);
                resolve(saintsData);
                return; // Arrêter ici, ne pas essayer de charger le JSON
            } else {
                console.error('Données intégrées non disponibles');
                resolve(getFallbackSaintsData());
                return;
            }
        }
        
        // En environnement serveur, essayer de charger le fichier JSON d'abord
        console.log('Tentative de chargement du fichier martyrologe.json...');
        $.ajax({
            url: 'martyrologe.json',
            dataType: 'json',
            success: function(data) {
                saintsData = data;
                console.log('Données des saints chargées avec succès:', saintsData);
                resolve(saintsData);
            },
            error: function(xhr, status, error) {
                console.error('Échec du chargement avec AJAX:', error);
                
                // Utiliser les données intégrées comme fallback
                if (typeof integratedSaintsData !== 'undefined') {
                    console.log('Utilisation des données intégrées comme fallback');
                    saintsData = integratedSaintsData;
                    resolve(saintsData);
                } else {
                    console.error('Données intégrées non disponibles, utilisation des données minimales');
                    resolve(getFallbackSaintsData());
                }
            }
        });
    });
}

// Données de secours en cas d'erreur de chargement
function getFallbackSaintsData() {
    return {
        "meta": {
            "version": "1.0",
            "last_updated": "2023-11-15",
            "source": "Données de secours"
        },
        "saints": {
            "default": [
                {
                    "id": "saint-inconnu",
                    "nom": "Saint(s) du jour",
                    "titre": "Célébration",
                    "date": "Aujourd'hui",
                    "biographie": "Les données des saints ne sont pas disponibles pour le moment. Veuillez vérifier votre connexion ou revenir plus tard.",
                    "type": "inconnu",
                    "lieu": "Inconnu",
                    "siecle": "Inconnu",
                    "attributs": []
                }
            ]
        }
    };
}

async function getSaintsOfTheDay(date) {
    const saintsData = await loadSaintsData();
    
    console.log('Données des saints chargées:', saintsData);
    
    // Formater la date au format MM-JJ
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${month}-${day}`;
    
    console.log(`Recherche des saints pour la date ${dateKey}`);
    console.log('Clés disponibles dans saints:', Object.keys(saintsData.saints));
    
    // Retourner les saints pour cette date, ou un message par défaut
    const saintsForDay = saintsData.saints[dateKey];
    
    if (saintsForDay && saintsForDay.length > 0) {
        console.log(`Trouvé ${saintsForDay.length} saints pour cette date`);
        return saintsForDay;
    } else {
        console.log('Aucun saint trouvé pour cette date, utilisation des données par défaut');
        return saintsData.saints.default || [
            {
                "id": "aucun-saint",
                "nom": "Aucun saint répertorié",
                "titre": "Martyrologe",
                "date": date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }),
                "biographie": "Aucun saint ou bienheureux n'est spécifiquement répertorié pour ce jour dans notre base de données.",
                "type": "information",
                "lieu": "-",
                "siecle": "-",
                "attributs": []
            }
        ];
    }
}

// Fonction pour formater la biographie d'un saint (version simplifiée)
function formatSaintBiography(saint) {
    let html = `<div class="saint-entry">`;
    
    // Pour le moment, on affiche uniquement la biographie comme demandé
    html += `<div class="saint-biography">`;
    html += saint.biographie;
    html += `</div>`;
    
    html += `</div>`;
    
    return html;
}

// Fonction pour créer le contenu du Martyrologe avec les saints du jour
async function create_martyrologe_html_with_saints(infos, date_obj) {
    const saints = await getSaintsOfTheDay(date_obj);
    
    var titre = '<div class="office_titre" id="office_titre">';
    titre = titre.concat("<h1> Martyrologe du " + date_obj.getDate() + " " + tab_mois[date_obj.getMonth()] + "</h1>");
    titre = titre.concat(infos['ligne1'] + "</div>");

    var sommaire = '<div class="office_sommaire" id="office_sommaire"><ul>';
    var texte_final = '<div class="office_text" id="office_text">';

    // Introduction
    texte_final = texte_final.concat('<div class="text_part" id="introduction">');
    texte_final = texte_final.concat('<p>Anniversaires inscrits au martyrologe du ' + date_obj.getDate() + ' ' + tab_mois[date_obj.getMonth()] + '</p></div>');
    sommaire = sommaire.concat('<li><a href="#introduction">Introduction</a></li>');

    // Saints du jour
    texte_final = texte_final.concat('<div class="text_part" id="saintsinscrits">');
    
    // Ajouter chaque saint
    saints.forEach((saint, index) => {
        texte_final = texte_final.concat(formatSaintBiography(saint));
    });
    
    texte_final = texte_final.concat('</div>');
    sommaire = sommaire.concat('<li><a href="#saintsinscrits">Saints du jour</a></li>');

    // Conclusion
    texte_final = texte_final.concat('<div class="text_part" id="conclusion">');
    texte_final = texte_final.concat('<p>Ailleurs enfin, anniversaires de nombreux autres saints dont le nom est inscrit au Livre de Vie.</p></div>');
    texte_final = texte_final.concat('<p><i>Au temps pascal :</i></p><p>Le même jour enfin, anniversaires d’une nuée d’autres témoins de toute race, langue et nation, entrés dans le Paradis du Christ.</p></div>');
    sommaire = sommaire.concat('<li><a href="#conclusion">Conclusion</a></li>');

    sommaire = sommaire.concat('</ul></div>');
    texte_final = texte_final.concat('</div>');
    
    // Ajouter le style CSS pour les entrées des saints (version simplifiée)
    texte_final = texte_final.concat(`
    <style>
        .saint-entry {
            margin-bottom: 20px;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .saint-biography {
            line-height: 1.6;
            margin: 10px 0;
        }
        .saint-biography p {
            margin: 0;
        }
    </style>
    `);
    
    return {texte: texte_final, titre: titre, sommaire: sommaire, couleur: infos['couleur']};
}

// Fonction pour mettre à jour le Martyrologe avec les saints du jour
async function update_martyrologe_with_saints() {
    const date = $('#date').val();
    const date_obj = new Date(date);
    
    // Créer les données minimales pour le Martyrologe
    var martyrologe_data = {
      "informations": {
        "ligne1": "<h2>Martyrologe</h2>",
        "couleur": "rouge",
        "temps_liturgique": "default",
        "semaine": "",
        "degre": "",
        "jour_liturgique_nom": "Martyrologe"
      }
    };
    
    try {
        var html_text = await create_martyrologe_html_with_saints(martyrologe_data["informations"], date_obj);
        
        $(".office_content").each(function(){$(this).html(html_text.texte)});
        $(".office_titre").each(function(){$(this).html(html_text.titre)});
        $(".office_sommaire").each(function(){$(this).html(html_text.sommaire)});
        $(".office_biographie").each(function(){$(this).html("")});
        update_anchors();
        update_liturgical_color(html_text.couleur);
        update_office_class("martyrologe");
    } catch (error) {
        console.error("Erreur lors de la mise à jour du Martyrologe:", error);
        // Afficher un message d'erreur
        $(".office_content").html("<div class='text_part'><h2>Erreur de chargement</h2><p>Impossible de charger les données du Martyrologe. Veuillez vérifier votre connexion internet.</p></div>");
    }
}